import { describe, expect, it } from 'vitest'
import { buildSnapshot } from './snapshot'
import { NOW, historyPr, openPr, review } from './testFactories'

describe('buildSnapshot', () => {
  it('assembles every part of the scene state', () => {
    const snapshot = buildSnapshot({
      open: [openPr({ number: 1, createdAt: '2025-12-02T17:29:00Z' }), openPr({ number: 2, isDraft: true })],
      history: [historyPr({ author: 'x', reviews: [review('henry', '2026-10-15T14:00:00Z')] })],
      members: ['example-user', 'henry'],
      now: NOW,
      modelIds: ['m1'],
      overrides: {},
      excluded: [],
      org: 'acme',
      ctoLogin: 'alice',
      stale: false,
    })
    expect(snapshot.generatedAt).toBe(NOW.toISOString())
    expect(snapshot.meta).toEqual({ org: 'acme', ctoLogin: 'alice' })
    expect(snapshot.counters[0].queue.map(p => p.number)).toEqual([1])
    expect(snapshot.waitingRoom.map(p => p.number)).toEqual([2])
    expect(snapshot.oldestPr?.number).toBe(1)
    expect(snapshot.strike.active).toBe(false)
    expect(snapshot.board.ranking[0]).toEqual({ login: 'henry', reviews: 1 })
    expect(snapshot.people.every(p => p.modelId === 'm1')).toBe(true)
    expect(snapshot.stats).toMatchObject({ queueNow: 1, unreviewedCount: 1, oldestUnreviewed: { repo: 'api', number: 1 } })
  })
})
