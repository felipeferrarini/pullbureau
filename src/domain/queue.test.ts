import { describe, expect, it } from 'vitest'
import { buildCounters, buildWaitingRoom, findOldest, isBrawl, toQueuedPr } from './queue'
import { NOW, historyPr, message, openPr, review } from './testFactories'

describe('toQueuedPr', () => {
  it('derives age, reviewers and discussion participants', () => {
    const queued = toQueuedPr(openPr({
      createdAt: '2026-10-05T15:00:00Z',
      reviews: [review('example-user', '2026-10-06T00:00:00Z', 'commented'), review('henry', '2026-10-06T00:00:00Z')],
      messages: [message('example-user', '2026-10-06T00:00:00Z'), message('henry', '2026-10-06T01:00:00Z'), message('henry', '2026-10-06T02:00:00Z')],
    }), NOW)
    expect(queued.ageDays).toBe(10)
    expect(queued.reviewedBy).toEqual(['henry'])
    expect(queued.discussion).toEqual({ messages: 3, participants: ['example-user', 'henry'] })
  })
})

describe('isBrawl', () => {
  const many = (authors: string[]) => authors.map((author, i) => message(author, `2026-10-06T0${i % 10}:00:00Z`))
  it('needs ten messages from at least two people', () => {
    expect(isBrawl(toQueuedPr(openPr({ messages: many(Array(10).fill('a').map((a, i) => (i % 2 ? 'b' : a))) }), NOW))).toBe(true)
    expect(isBrawl(toQueuedPr(openPr({ messages: many(Array(9).fill('a').map((a, i) => (i % 2 ? 'b' : a))) }), NOW))).toBe(false)
    expect(isBrawl(toQueuedPr(openPr({ messages: many(Array(12).fill('a')) }), NOW))).toBe(false)
  })
})

describe('buildCounters', () => {
  const open = [
    openPr({ number: 2, createdAt: '2026-10-12T00:00:00Z' }),
    openPr({ number: 1, createdAt: '2026-10-01T00:00:00Z' }),
    openPr({ number: 3, isDraft: true }),
    openPr({ repo: 'students', number: 9 }),
  ]
  const history = [
    historyPr({ number: 50, state: 'merged', mergedAt: '2026-10-14T00:00:00Z', reviews: [review('henry', '2026-10-13T00:00:00Z'), review('example-user', '2026-10-13T00:00:00Z')] }),
    historyPr({ number: 40, state: 'merged', mergedAt: '2026-10-02T00:00:00Z', author: 'carol', reviews: [review('example-user', '2026-10-01T00:00:00Z'), review('henry', '2026-08-01T00:00:00Z')] }),
    historyPr({ repo: 'infra', number: 7, state: 'closed', closedAt: '2026-10-14T00:00:00Z' }),
    historyPr({ repo: 'old-repo', number: 1, state: 'merged', mergedAt: '2026-09-01T00:00:00Z' }),
  ]
  const counters = buildCounters(open, history, NOW)

  it('creates one counter per repo with open PRs or activity in 7 days, longest queue first', () => {
    expect(counters.map(c => c.repo)).toEqual(['api', 'students', 'infra'])
  })

  it('carries the activity of each repo', () => {
    expect(counters.find(c => c.repo === 'infra')).toEqual(expect.objectContaining({ lastActivityAt: '2026-10-14T00:00:00Z', activity7d: 1 }))
  })

  it('orders the queue oldest first and leaves drafts out', () => {
    expect(counters[0].queue.map(p => p.number)).toEqual([1, 2])
  })

  it('uses the latest merged PR as the current ticket', () => {
    expect(counters[0].currentTicket).toBe(50)
    expect(counters[1].currentTicket).toBe(0)
  })

  it('lists reviewers of the last 30 days, ignoring self reviews, busiest first then alphabetical', () => {
    // #50 is authored by example-user (factory default): his own review there does not count.
    // #40: felipe counts; henry's August review is outside the window. Result: 1 x 1, tie broken by login.
    expect(counters[0].attendants).toEqual(['example-user', 'henry'])
  })
})

describe('buildWaitingRoom and findOldest', () => {
  it('puts drafts in the waiting room and finds the oldest queued PR', () => {
    const open = [openPr({ number: 1, isDraft: true, createdAt: '2025-01-01T00:00:00Z' }), openPr({ number: 2, createdAt: '2026-01-01T00:00:00Z' })]
    expect(buildWaitingRoom(open, NOW).map(p => p.number)).toEqual([1])
    expect(findOldest(buildCounters(open, [], NOW))?.number).toBe(2)
    expect(findOldest([])).toBeNull()
  })
})

it('keeps non-draft PRs without the readiness label in the waiting room', () => {
  const open = [openPr({ isDraft: false, isReady: false })]
  expect(buildWaitingRoom(open, NOW)).toHaveLength(1)
  expect(buildCounters(open, [], NOW)[0].queue).toHaveLength(0)
})
