import { describe, expect, it } from 'vitest'
import { overviewCamera } from '../layout'
import { CUTAWAY_FROM, CUTAWAY_TO, cutawayLevel } from './cutawayLevel'

describe('cutawayLevel', () => {
  it('stands the facade up at street level and lays it down from above', () => {
    expect(cutawayLevel(1.7)).toBe(1)
    expect(cutawayLevel(CUTAWAY_FROM)).toBe(1)
    expect(cutawayLevel((CUTAWAY_FROM + CUTAWAY_TO) / 2)).toBeCloseTo(0.5)
    expect(cutawayLevel(CUTAWAY_TO)).toBe(0)
  })

  it('keeps the facade down in every overview', () => {
    for (const aspect of [0.46, 1, 16 / 10, 21 / 9]) expect(cutawayLevel(overviewCamera(10, aspect).position[1])).toBe(0)
    expect(cutawayLevel(overviewCamera(1, 16 / 10).position[1])).toBe(0)
  })
})
