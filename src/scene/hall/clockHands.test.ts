import { describe, expect, it } from 'vitest'
import { clockHands } from './clockHands'

describe('clockHands', () => {
  it('points at Brasília time, three hours behind utc', () => {
    const hands = clockHands(new Date('2026-10-16T18:30:00Z'))
    expect(hands.hour).toBeCloseTo(((3.5 / 12) * Math.PI * 2), 5)
    expect(hands.minute).toBeCloseTo(Math.PI, 5)
    expect(hands.second).toBe(0)
  })

  it('sweeps the second hand', () => {
    expect(clockHands(new Date('2026-10-16T18:30:15Z')).second).toBeCloseTo(Math.PI / 2, 5)
  })
})
