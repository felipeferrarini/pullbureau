import { describe, expect, it } from 'vitest'
import { danceFor, sparkleSpots } from './disco'

describe('disco', () => {
  it('gives each person a stable dance move', () => {
    expect(danceFor('pr:a#1')).toBe(danceFor('pr:a#1'))
    const moves = new Set(Array.from({ length: 40 }, (_, i) => danceFor(`pr:a#${i}`)))
    expect(moves.size).toBeGreaterThan(1)
  })

  it('spreads the reflections inside a disc', () => {
    const spots = sparkleSpots(100, 10)
    expect(spots).toHaveLength(100)
    expect(spots.every(([x, z]) => Math.hypot(x, z) <= 10)).toBe(true)
  })
})
