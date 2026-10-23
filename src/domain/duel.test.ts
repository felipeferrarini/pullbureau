import { describe, expect, it } from 'vitest'
import type { PrThread } from '@/types/domain'
import { DRAW_HP_LOSS, LOSER_HP_LOSS, WINNER_HP_LOSS, buildDuelScript, decideOutcome, forcedThreadState, pickFighters } from './duel'
import { message, review } from './testFactories'

const at = (i: number) => new Date(Date.UTC(2026, 9, 10, 0, i)).toISOString()

function thread(overrides: Partial<PrThread> = {}): PrThread {
  const messages = Array.from({ length: 12 }, (_, i) => message(i % 2 ? 'henry' : 'example-user', at(i), `argumento ${i} `.repeat(i + 1)))
  return { repo: 'api', number: 412, title: 't', url: 'u', author: 'example-user', state: 'open', reviews: [], messages, ...overrides }
}

const lossOf = (script: NonNullable<ReturnType<typeof buildDuelScript>>, login: string) =>
  script.moves.filter(move => move.defender === login).reduce((sum, move) => sum + move.damage, 0)

describe('pickFighters', () => {
  it('picks the two most active participants', () => {
    expect(pickFighters([message('a', at(0)), message('b', at(1)), message('b', at(2)), message('c', at(3))])).toEqual(['b', 'a'])
    expect(pickFighters([message('a', at(0))])).toBeNull()
  })
})

describe('decideOutcome', () => {
  const fighters: [string, string] = ['example-user', 'henry']

  it('ends a merged pr in an APPROVED won by the author', () => {
    expect(decideOutcome(thread({ state: 'merged' }), fighters)).toEqual({ kind: 'approved', winner: 'example-user' })
    expect(decideOutcome(thread({ state: 'merged', author: 'outsider' }), fighters).winner).toBe('example-user')
  })

  it('ends a closed pr in a CLOSED won by the blocker, or by whoever is not the author', () => {
    const blocked = thread({ state: 'closed', reviews: [review('henry', at(20), 'changes_requested')] })
    expect(decideOutcome(blocked, fighters)).toEqual({ kind: 'closed', winner: 'henry' })
    expect(decideOutcome(thread({ state: 'closed' }), fighters)).toEqual({ kind: 'closed', winner: 'henry' })
  })

  it('leaves an open pr TO BE CONTINUED, with the blocker or the approved author ahead', () => {
    const blocked = thread({ reviews: [review('henry', at(20), 'changes_requested')] })
    expect(decideOutcome(blocked, fighters)).toEqual({ kind: 'to_be_continued', winner: 'henry' })
    expect(decideOutcome(thread({ reviews: [review('henry', at(20))] }), fighters)).toEqual({ kind: 'to_be_continued', winner: 'example-user' })
    expect(decideOutcome(thread(), fighters)).toEqual({ kind: 'to_be_continued', winner: null })
  })

  it('uses the latest review per reviewer', () => {
    const t = thread({ reviews: [review('henry', at(20), 'changes_requested'), review('henry', at(21), 'approved')] })
    expect(decideOutcome(t, fighters).winner).toBe('example-user')
  })
})

describe('buildDuelScript', () => {
  it('turns each message of the two fighters into a move, in order', () => {
    const script = buildDuelScript(thread())
    expect(script?.moves).toHaveLength(12)
    expect(script?.moves[1]).toMatchObject({ attacker: 'henry', defender: 'example-user', isCounter: true })
  })

  it('normalises damage so the loser ends at zero and the winner survives', () => {
    const script = buildDuelScript(thread({ reviews: [review('henry', at(20), 'changes_requested')] }))!
    expect(lossOf(script, 'example-user')).toBe(LOSER_HP_LOSS)
    expect(lossOf(script, 'henry')).toBe(WINNER_HP_LOSS)
    expect(script.moves.filter(move => move.finishHim)).toHaveLength(1)
    expect(script.moves.findLast(move => move.defender === 'example-user')?.finishHim).toBe(true)
  })

  it('leaves both standing when nobody is ahead', () => {
    const script = buildDuelScript(thread())!
    expect(lossOf(script, 'example-user')).toBe(DRAW_HP_LOSS)
    expect(lossOf(script, 'henry')).toBe(DRAW_HP_LOSS)
    expect(script.moves.some(move => move.finishHim)).toBe(false)
  })

  it('is deterministic and caps the number of moves', () => {
    const long = thread({ messages: Array.from({ length: 50 }, (_, i) => message(i % 2 ? 'b' : 'a', at(i))) })
    expect(buildDuelScript(long)?.moves).toHaveLength(20)
    expect(buildDuelScript(long)).toEqual(buildDuelScript(long))
  })

  it('returns null with a single participant', () => {
    expect(buildDuelScript(thread({ messages: [message('a', at(0))] }))).toBeNull()
  })
})

describe('forcedThreadState', () => {
  it('maps the hidden finisher param to a pr state', () => {
    expect(forcedThreadState('approved')).toBe('merged')
    expect(forcedThreadState('CLOSED')).toBe('closed')
    expect(forcedThreadState('tbc')).toBe('open')
    expect(forcedThreadState('nope')).toBeNull()
    expect(forcedThreadState(null)).toBeNull()
  })
})
