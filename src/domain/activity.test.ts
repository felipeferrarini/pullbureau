import { describe, expect, it } from 'vitest'
import { counterActivity, splitCounters } from './activity'
import { NOW, counter, historyPr, message, openPr, review } from './testFactories'

const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString()

describe('counterActivity', () => {
  it('takes the latest timestamp of open PRs and history of the repo', () => {
    const open = [openPr({ createdAt: daysAgo(20), ciAt: daysAgo(3), messages: [message('a', daysAgo(2))], reviews: [review('b', daysAgo(1))] })]
    const history = [historyPr({ number: 9, state: 'merged', createdAt: daysAgo(10), mergedAt: daysAgo(0.5), closedAt: daysAgo(0.5) })]
    expect(counterActivity('api', open, history, NOW).lastActivityAt).toBe(daysAgo(0.5))
  })

  it('ignores other repos and returns null without activity', () => {
    expect(counterActivity('students', [openPr()], [historyPr()], NOW)).toEqual({ lastActivityAt: null, activity7d: 0 })
  })

  it('counts distinct activity in the last 7 days, without double counting PRs present in both lists', () => {
    const shared = review('b', daysAgo(1))
    const open = [openPr({ createdAt: daysAgo(3), ciAt: daysAgo(3), reviews: [shared], messages: [message('a', daysAgo(2)), message('a', daysAgo(9))] })]
    const history = [
      historyPr({ createdAt: daysAgo(3), reviews: [shared] }),
      historyPr({ number: 2, state: 'merged', createdAt: daysAgo(30), mergedAt: daysAgo(6), closedAt: daysAgo(6) }),
      historyPr({ number: 3, state: 'closed', createdAt: daysAgo(30), closedAt: daysAgo(8) }),
    ]
    // #1: created, ci, review, one recent message = 4; #2: merged = 1; #3: closed 8 days ago = 0
    expect(counterActivity('api', open, history, NOW).activity7d).toBe(5)
  })
})

describe('splitCounters', () => {
  const rule = { activeDays: 14, maxVisible: 2 }
  const active = (repo: string, days: number) => counter({ repo, lastActivityAt: daysAgo(days) })

  it('keeps active counters in order and moves inactive ones to closed', () => {
    const split = splitCounters([active('a', 1), active('b', 20), counter({ repo: 'c' }), active('d', 13)], NOW, rule)
    expect(split.visible.map(c => c.repo)).toEqual(['a', 'd'])
    expect(split.closed.map(c => c.repo)).toEqual(['b', 'c'])
  })

  it('caps the visible counters and sends the overflow to closed', () => {
    const split = splitCounters([active('a', 1), active('b', 2), active('c', 3), active('d', 30)], NOW, rule)
    expect(split.visible.map(c => c.repo)).toEqual(['a', 'b'])
    expect(split.closed.map(c => c.repo)).toEqual(['c', 'd'])
  })

  it('defaults to 14 active days and 10 visible counters', () => {
    const many = Array.from({ length: 12 }, (_, i) => active(`r${i}`, 1))
    expect(splitCounters(many, NOW).visible).toHaveLength(10)
  })
})
