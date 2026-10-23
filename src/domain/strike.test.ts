import { describe, expect, it } from 'vitest'
import { buildStrike, lastReviewAt } from './strike'
import { historyPr, review } from './testFactories'

const lastAt = (at: string) => [historyPr({ reviews: [review('henry', '2026-10-01T00:00:00Z'), review('henry', at)] })]

describe('buildStrike', () => {
  it('is calm after 2 business hours across a weekend', () => {
    expect(buildStrike(lastAt('2026-10-16T20:00:00Z'), new Date('2026-10-19T13:00:00Z'))).toEqual({ active: false, since: null })
  })

  it('starts after 4 business hours, even on a UTC server', () => {
    expect(buildStrike(lastAt('2026-10-16T20:00:00Z'), new Date('2026-10-19T15:00:00Z'))).toEqual({ active: true, since: '2026-10-16T20:00:00Z' })
  })

  it('does not start overnight', () => {
    expect(buildStrike(lastAt('2026-10-15T20:30:00Z'), new Date('2026-10-16T11:30:00Z')).active).toBe(false)
  })

  it('is active with no reviews at all', () => {
    expect(buildStrike([], new Date('2026-10-19T15:00:00Z'))).toEqual({ active: true, since: null })
  })

  it('finds the latest review across PRs', () => {
    expect(lastReviewAt([...lastAt('2026-10-10T00:00:00Z'), ...lastAt('2026-10-12T00:00:00Z')])).toBe('2026-10-12T00:00:00Z')
  })
})
