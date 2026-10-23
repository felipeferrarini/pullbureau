import { describe, expect, it } from 'vitest'
import { buildStats, median } from './stats'
import { NOW, emptyStats, historyPr, openPr, review } from './testFactories'

const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString()
const daysAgo = (days: number) => hoursAgo(days * 24)

describe('median', () => {
  it('takes the middle value, averages the two middle ones and is null when empty', () => {
    expect(median([5, 1, 3])).toBe(3)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBeNull()
  })
})

describe('buildStats', () => {
  it('is empty without data', () => {
    expect(buildStats([], [], NOW)).toEqual(emptyStats())
  })

  it('counts the queue now and reconstructs it 7 days ago', () => {
    const open = [
      openPr({ number: 1, createdAt: daysAgo(10) }),
      openPr({ number: 2, createdAt: daysAgo(2) }),
      openPr({ number: 3, createdAt: daysAgo(10), isDraft: true }),
    ]
    const history = [
      historyPr({ number: 1, createdAt: daysAgo(10) }),
      historyPr({ number: 4, state: 'merged', createdAt: daysAgo(9), mergedAt: daysAgo(3), closedAt: daysAgo(3) }),
      historyPr({ number: 5, state: 'closed', createdAt: daysAgo(20), closedAt: daysAgo(8) }),
      historyPr({ number: 6, state: 'merged', createdAt: daysAgo(5), mergedAt: daysAgo(1), closedAt: daysAgo(1) }),
    ]
    const stats = buildStats(open, history, NOW)
    expect(stats.queueNow).toBe(2)
    expect(stats.queue7dAgo).toBe(2) // #1 still open, #4 merged since
  })

  it('measures inflow without bots and outflow as merges plus closes', () => {
    const open = [openPr({ number: 1, createdAt: daysAgo(1) }), openPr({ number: 2, createdAt: daysAgo(2), authorIsBot: true, author: 'dependabot' })]
    const history = [
      historyPr({ number: 1, createdAt: daysAgo(1) }),
      historyPr({ number: 3, state: 'merged', createdAt: daysAgo(3), mergedAt: daysAgo(2), closedAt: daysAgo(2) }),
      historyPr({ number: 4, state: 'closed', createdAt: daysAgo(20), closedAt: daysAgo(6) }),
      historyPr({ number: 5, state: 'merged', createdAt: daysAgo(20), mergedAt: daysAgo(9), closedAt: daysAgo(9) }),
    ]
    expect(buildStats(open, history, NOW)).toMatchObject({ inflow7d: 2, outflow7d: 2 })
  })

  it('takes the median of business hours until the first human review and until the merge in 30 days', () => {
    const monday9 = '2026-10-12T12:00:00Z'
    const history = [
      historyPr({ number: 1, createdAt: monday9, reviews: [review('example-user', '2026-10-12T13:00:00Z', 'commented'), review('henry', '2026-10-12T14:00:00Z')], state: 'merged', mergedAt: '2026-10-13T12:00:00Z' }),
      historyPr({ number: 2, createdAt: monday9, reviews: [review('henry', '2026-10-12T16:00:00Z')] }),
      historyPr({ number: 3, createdAt: monday9, reviews: [review('henry', '2026-10-12T18:00:00Z')], state: 'merged', mergedAt: '2026-10-14T12:00:00Z' }),
      historyPr({ number: 4, createdAt: '2026-08-01T12:00:00Z', reviews: [review('henry', '2026-08-02T12:00:00Z')], state: 'merged', mergedAt: '2026-08-03T12:00:00Z' }),
    ]
    const stats = buildStats([], history, NOW)
    expect(stats.medianFirstReviewHours30d).toBe(4) // 2h, 4h, 6h
    expect(stats.medianMergeHours30d).toBe(13.5) // 9h and 18h
  })

  it('counts open PRs waiting more than one business day without a human review and finds the oldest', () => {
    const open = [
      openPr({ number: 1, createdAt: daysAgo(5) }),
      openPr({ number: 2, createdAt: daysAgo(9), reviews: [review('example-user', daysAgo(8), 'commented')] }),
      openPr({ number: 3, createdAt: daysAgo(20), reviews: [review('henry', daysAgo(1))] }),
      openPr({ number: 4, createdAt: hoursAgo(2) }),
      openPr({ number: 5, createdAt: daysAgo(30), isDraft: true }),
    ]
    const stats = buildStats(open, [], NOW)
    expect(stats.unreviewedCount).toBe(2)
    expect(stats.oldestUnreviewed).toEqual({ repo: 'api', number: 2 })
  })

  it('computes the share of red CI among queued PRs with CI', () => {
    const open = [openPr({ number: 1, ci: 'failure' }), openPr({ number: 2, ci: 'success' }), openPr({ number: 3, ci: 'pending' }), openPr({ number: 4, ci: 'none' }), openPr({ number: 5, ci: 'failure', isDraft: true })]
    expect(buildStats(open, [], NOW).ciRedPct).toBe(33)
    expect(buildStats([openPr({ ci: 'none' })], [], NOW).ciRedPct).toBeNull()
  })
})
