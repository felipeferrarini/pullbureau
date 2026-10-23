import type { Message, PrState, PrThread, Review, ReviewState } from '@/types/domain'
import type { DuelOutcome, DuelScript } from '@/types/duel'
import { toRef } from './events'
import { toExcerpt } from './excerpt'

export const MAX_MOVES = 20
export const LOSER_HP_LOSS = 100
export const WINNER_HP_LOSS = 60
export const DRAW_HP_LOSS = 70

const MIN_WEIGHT = 20
const MAX_WEIGHT = 400
const MOVE_EXCERPT_LENGTH = 40

export function pickFighters(messages: Message[]): [string, string] | null {
  const tally = new Map<string, { count: number; chars: number }>()
  for (const message of messages) {
    const entry = tally.get(message.author) ?? { count: 0, chars: 0 }
    tally.set(message.author, { count: entry.count + 1, chars: entry.chars + message.body.length })
  }
  const ranked = [...tally.entries()].sort(([a, x], [b, y]) => y.count - x.count || y.chars - x.chars || a.localeCompare(b))
  return ranked.length < 2 ? null : [ranked[0][0], ranked[1][0]]
}

function latestDecisions(reviews: Review[]): Map<string, ReviewState> {
  const latest = new Map<string, ReviewState>()
  for (const review of [...reviews].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))) {
    if (review.state !== 'commented') latest.set(review.reviewer, review.state)
  }
  return latest
}

function leader(thread: PrThread, fighters: [string, string], latest: Map<string, ReviewState>): string | null {
  const blocker = fighters.find(f => latest.get(f) === 'changes_requested')
  if (blocker) return blocker
  if ([...latest.values()].includes('approved')) return fighters.includes(thread.author) ? thread.author : fighters[0]
  return null
}

// Merged: the author wins the APPROVED. Closed: whoever blocked it (or the other fighter) wins the CLOSED.
// Still open: TO BE CONTINUED, with whoever is ahead in the reviews (if anyone) about to land the last blow.
export function decideOutcome(thread: PrThread, fighters: [string, string]): DuelOutcome {
  const latest = latestDecisions(thread.reviews.filter(review => review.reviewer !== thread.author))
  if (thread.state === 'merged') return { kind: 'approved', winner: fighters.includes(thread.author) ? thread.author : fighters[0] }
  if (thread.state === 'closed') {
    const blocker = fighters.find(f => latest.get(f) === 'changes_requested')
    return { kind: 'closed', winner: blocker ?? fighters.find(f => f !== thread.author) ?? fighters[1] }
  }
  return { kind: 'to_be_continued', winner: leader(thread, fighters, latest) }
}

function distribute(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const parts = weights.map(weight => Math.floor((weight * total) / sum))
  let rest = total - parts.reduce((a, b) => a + b, 0)
  for (let i = parts.length - 1; rest > 0; i = (i - 1 + parts.length) % parts.length) {
    parts[i]++
    rest--
  }
  return parts
}

export function buildDuelScript(thread: PrThread): DuelScript | null {
  const fighters = pickFighters(thread.messages)
  if (!fighters) return null
  const other = (login: string) => (login === fighters[0] ? fighters[1] : fighters[0])
  const bouts = thread.messages.filter(message => fighters.includes(message.author)).slice(-MAX_MOVES)
  const outcome = decideOutcome(thread, fighters)
  const lossFor = (defender: string) =>
    !outcome.winner ? DRAW_HP_LOSS : defender === outcome.winner ? WINNER_HP_LOSS : LOSER_HP_LOSS

  const damage = new Array<number>(bouts.length).fill(0)
  for (const defender of fighters) {
    const hits = bouts.flatMap((message, i) => (other(message.author) === defender ? [i] : []))
    if (!hits.length) continue
    const weights = hits.map(i => Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, bouts[i].body.length)))
    distribute(weights, lossFor(defender)).forEach((value, k) => {
      damage[hits[k]] = value
    })
  }

  const loser = outcome.winner ? other(outcome.winner) : null
  const finalHit = loser ? bouts.map(message => other(message.author)).lastIndexOf(loser) : -1
  return {
    pr: toRef(thread),
    fighters,
    outcome,
    moves: bouts.map((message, i) => ({
      attacker: message.author,
      defender: other(message.author),
      excerpt: toExcerpt(message.body, MOVE_EXCERPT_LENGTH),
      damage: damage[i],
      isCounter: i > 0 && bouts[i - 1].author !== message.author,
      finishHim: i === finalHit,
    })),
  }
}

const FORCED_STATES: Record<string, PrState> = { approved: 'merged', closed: 'closed', tbc: 'open' }

// Hidden ?finisher= param: replays the real thread as if the pr had been merged, closed or left open.
export function forcedThreadState(param: string | null): PrState | null {
  return (param && FORCED_STATES[param.toLowerCase()]) || null
}
