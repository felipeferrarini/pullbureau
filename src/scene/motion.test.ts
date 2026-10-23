import { describe, expect, it } from 'vitest'
import { lerpAngle, stepTowards } from './motion'

describe('stepTowards', () => {
  it('moves by at most maxStep and reports heading', () => {
    const result = stepTowards([0, 0, 0], [0, 0, 10], 1)
    expect(result.next).toEqual([0, 0, 1])
    expect(result.moving).toBe(true)
    expect(result.heading).toBeCloseTo(0)
    expect(stepTowards([0, 0, 0], [10, 0, 0], 1).heading).toBeCloseTo(Math.PI / 2)
  })

  it('snaps to the target without overshooting', () => {
    expect(stepTowards([0, 0, 0], [0, 0, 0.5], 1)).toEqual({ next: [0, 0, 0.5], moving: true, heading: 0 })
    expect(stepTowards([0, 0, 0.5], [0, 0, 0.5], 1).moving).toBe(false)
  })

  it('has no heading when only falling', () => {
    expect(stepTowards([0, 0, 0], [0, -3, 0], 1).heading).toBeNull()
  })
})

describe('lerpAngle', () => {
  it('takes the shortest path across ±π', () => {
    expect(lerpAngle(Math.PI - 0.1, -Math.PI + 0.1, 0.5)).toBeCloseTo(Math.PI)
    expect(lerpAngle(0, 1, 2)).toBeCloseTo(1)
  })
})
