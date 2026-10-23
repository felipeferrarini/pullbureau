import type { HistoryPr, OpenPr, PrRef, SceneEvent, SceneEventKind } from '@/types/domain'
import { toExcerpt } from './excerpt'
import { isQueueJump } from './reviews'
import { DAY_MS, isWithin } from './time'

export const EVENT_WINDOW_MS = DAY_MS

const KIND_ORDER: Record<SceneEventKind, number> = { pr_opened: 0, comment: 1, review: 2, ci: 3, merged: 4, closed: 5 }
const keyOf = (pr: PrRef) => `${pr.repo}#${pr.number}`

export const toRef = (pr: PrRef): PrRef => ({ repo: pr.repo, number: pr.number, title: pr.title, url: pr.url, author: pr.author })

function openedEvents(open: OpenPr[], history: HistoryPr[], within: (iso: string | null) => boolean): SceneEvent[] {
  const byKey = new Map<string, PrRef & { createdAt: string }>()
  for (const pr of [...history, ...open]) byKey.set(keyOf(pr), pr)
  return [...byKey.values()].filter(pr => within(pr.createdAt)).map(pr => ({ kind: 'pr_opened', at: pr.createdAt, pr: toRef(pr) }))
}

function reviewEvents(open: OpenPr[], history: HistoryPr[], within: (iso: string | null) => boolean): SceneEvent[] {
  const byKey = new Map<string, SceneEvent>()
  for (const pr of [...history, ...open]) {
    for (const review of pr.reviews) {
      if (!within(review.at)) continue
      byKey.set(`${keyOf(pr)}|${review.reviewer}|${review.at}`, { kind: 'review', at: review.at, pr: toRef(pr), reviewer: review.reviewer, state: review.state })
    }
  }
  return [...byKey.values()]
}

function commentEvents(open: OpenPr[], within: (iso: string | null) => boolean): SceneEvent[] {
  return open.flatMap(pr => {
    const lastAuthorByThread = new Map<string, string>()
    return pr.messages.flatMap(message => {
      const previous = message.threadId ? lastAuthorByThread.get(message.threadId) : undefined
      if (message.threadId) lastAuthorByThread.set(message.threadId, message.author)
      if (!within(message.at)) return []
      const replyTo = previous && previous !== message.author ? previous : null
      return [{ kind: 'comment' as const, at: message.at, pr: toRef(pr), author: message.author, replyTo, excerpt: toExcerpt(message.body) }]
    })
  })
}

function ciEvents(open: OpenPr[], within: (iso: string | null) => boolean): SceneEvent[] {
  return open
    .filter(pr => (pr.ci === 'success' || pr.ci === 'failure') && within(pr.ciAt))
    .map(pr => ({ kind: 'ci', at: pr.ciAt as string, pr: toRef(pr), result: pr.ci as 'success' | 'failure' }))
}

function closingEvents(history: HistoryPr[], within: (iso: string | null) => boolean): SceneEvent[] {
  return history.flatMap((pr): SceneEvent[] => {
    if (pr.state === 'merged' && within(pr.mergedAt)) return [{ kind: 'merged', at: pr.mergedAt as string, pr: toRef(pr), queueJump: isQueueJump(pr) }]
    if (pr.state === 'closed' && within(pr.closedAt)) return [{ kind: 'closed', at: pr.closedAt as string, pr: toRef(pr) }]
    return []
  })
}

export function deriveEvents(open: OpenPr[], history: HistoryPr[], now: Date): SceneEvent[] {
  const within = (iso: string | null) => isWithin(iso, now, EVENT_WINDOW_MS)
  return [
    ...openedEvents(open, history, within),
    ...reviewEvents(open, history, within),
    ...commentEvents(open, within),
    ...ciEvents(open, within),
    ...closingEvents(history, within),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
}
