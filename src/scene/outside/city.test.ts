import { describe, expect, it } from 'vitest'
import type { Rect } from '@/types/outside'
import { BACK_WALL_Z, FACADE_Z } from '../layout'
import { carPlans, carX, neighborLots } from './city'
import { ROAD, STREET_HALF_LENGTH } from './street'

const footprint: Rect = { minX: -23, maxX: 23, minZ: BACK_WALL_Z, maxZ: FACADE_Z }

const overlaps = (a: { x: number; z: number; width: number; depth: number }, b: Rect) =>
  a.x + a.width / 2 > b.minX && a.x - a.width / 2 < b.maxX && a.z + a.depth / 2 > b.minZ && a.z - a.depth / 2 < b.maxZ

describe('neighborLots', () => {
  const lots = neighborLots(footprint)

  it('never builds on the repartição, its side alley or the road', () => {
    const alley: Rect = { ...footprint, minX: footprint.minX - 5 }
    expect(lots.filter(lot => overlaps(lot, alley))).toEqual([])
    expect(lots.filter(lot => overlaps(lot, { minX: -999, maxX: 999, minZ: ROAD.near, maxZ: ROAD.far }))).toEqual([])
  })

  it('is deterministic and puts a few shops on the street', () => {
    expect(neighborLots(footprint)).toEqual(lots)
    expect(lots.filter(lot => lot.shop).length).toBeGreaterThanOrEqual(4)
  })
})

describe('cars', () => {
  it('loop along the street in their lane direction and wrap around', () => {
    const plan = carPlans()[0]
    const a = carX(plan, 0)
    const b = carX(plan, 1)
    expect(Math.sign(b - a)).toBe(plan.lane.direction)
    for (let t = 0; t < 200; t += 7) expect(Math.abs(carX(plan, t))).toBeLessThanOrEqual(STREET_HALF_LENGTH)
  })

  it('keep their distance in the same lane forever', () => {
    const plans = carPlans()
    for (let t = 0; t < 120; t += 0.5) {
      for (const a of plans) {
        for (const b of plans) {
          if (a === b || a.lane !== b.lane) continue
          const gap = Math.abs(carX(a, t) - carX(b, t))
          expect(Math.min(gap, 2 * STREET_HALF_LENGTH - gap)).toBeGreaterThan(8)
        }
      }
    }
  })
})
