import { describe, expect, it } from 'vitest'
import { RANKING_DAYS, buildBoard, monthTitle, noticeCards } from './board'
import { NOW, historyPr, review } from './testFactories'

describe('buildBoard', () => {
  const history = [
    historyPr({ author: 'carol', reviews: [
      review('henry', '2026-10-14T00:00:00Z'),
      review('henry', '2026-10-13T00:00:00Z'),
      review('example-user', '2026-10-12T00:00:00Z'),
      review('dave', '2026-09-20T00:00:00Z'),
      review('dave', '2026-09-21T00:00:00Z'),
      review('dave', '2026-09-22T00:00:00Z'),
    ] }),
  ]
  const board = buildBoard(history, ['example-user', 'henry', 'dave', 'alice', 'grace'], ['grace'], NOW)

  it('ranks every member by reviews in the last 30 days, zeros included', () => {
    expect(RANKING_DAYS).toBe(30)
    expect(board.ranking).toEqual([
      { login: 'dave', reviews: 3 },
      { login: 'henry', reviews: 2 },
      { login: 'example-user', reviews: 1 },
      { login: 'alice', reviews: 0 },
    ])
  })

  it('leaves reviews older than 30 days off the ranking', () => {
    const old = [historyPr({ author: 'x', reviews: [review('henry', '2026-09-10T00:00:00Z'), review('henry', '2026-09-20T00:00:00Z')] })]
    expect(buildBoard(old, ['henry'], [], NOW).ranking).toEqual([{ login: 'henry', reviews: 1 }])
  })

  it('elects the employee of the month over 30 days', () => {
    expect(board.employeeOfTheMonth).toBe('dave')
  })

  it('lists who did not review in the last 7 days, even if they reviewed this month', () => {
    expect(board.slacking).toEqual(['alice', 'dave'])
  })

  it('has no employee of the month when nobody reviewed', () => {
    expect(buildBoard([], ['a'], [], NOW).employeeOfTheMonth).toBeNull()
  })
})

describe('monthTitle', () => {
  it('names the Brasília month of the snapshot in PT-BR', () => {
    expect(monthTitle('2026-10-15T15:00:00Z')).toBe('OUTUBRO/2026')
    expect(monthTitle('2026-03-01T02:00:00Z')).toBe('FEVEREIRO/2026')
    expect(monthTitle('2027-01-01T12:00:00Z')).toBe('JANEIRO/2027')
  })
})

describe('noticeCards', () => {
  const board = (ranking: { login: string; reviews: number }[]) => ({ ranking, employeeOfTheMonth: null, slacking: [] })

  it('pins at most 8 reviewers with their rank, leaving out the zeros', () => {
    const ranking = Array.from({ length: 10 }, (_, i) => ({ login: `p${i}`, reviews: 10 - i }))
    const cards = noticeCards(board(ranking))
    expect(cards).toHaveLength(8)
    expect(cards[0]).toEqual({ rank: 1, login: 'p0', reviews: 10 })
    expect(cards[7]).toEqual({ rank: 8, login: 'p7', reviews: 3 })
    expect(noticeCards(board([{ login: 'a', reviews: 2 }, { login: 'b', reviews: 0 }]))).toEqual([{ rank: 1, login: 'a', reviews: 2 }])
  })

  it('shares the rank on ties', () => {
    const cards = noticeCards(board([{ login: 'a', reviews: 3 }, { login: 'b', reviews: 3 }, { login: 'c', reviews: 1 }]))
    expect(cards.map(card => card.rank)).toEqual([1, 1, 3])
  })
})
