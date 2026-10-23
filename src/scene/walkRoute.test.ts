import { describe, expect, it } from 'vitest'
import type { Rect } from '@/types/outside'
import type { Vec3 } from '@/types/scene'
import { DOOR, FACADE_Z, MAX_INSIDE, hallWidth } from './layout'
import { queueSlot } from './queueLanes'
import { walkRoute } from './walkRoute'

const footprint: Rect = { minX: -12, maxX: 12, minZ: -11, maxZ: FACADE_Z }
const within = (rect: Rect, [x, , z]: Vec3) => x > rect.minX && x < rect.maxX && z > rect.minZ && z < rect.maxZ

function throughWall(points: Vec3[], rect = footprint): boolean {
  const inside = (p: Vec3) => within(rect, p)
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]]
    for (let k = 0.02; k < 1; k += 0.02) {
      const p: Vec3 = [a[0] + (b[0] - a[0]) * k, 0, a[2] + (b[2] - a[2]) * k]
      const near: Vec3 = [a[0] + (b[0] - a[0]) * (k + 0.02), 0, a[2] + (b[2] - a[2]) * (k + 0.02)]
      if (inside(p) !== inside(near) && Math.abs(p[0]) > 1.6) return true
    }
  }
  return false
}

describe('walkRoute', () => {
  it('walks straight inside the hall and straight along the sidewalk', () => {
    expect(walkRoute([-5, 0, -6], [4, 0, 2], footprint)).toEqual([[4, 0, 2]])
    expect(walkRoute([-5, 0, 10], [6, 0, 9], footprint)).toEqual([[6, 0, 9]])
  })

  it('goes out and in by the front door, never through the wall', () => {
    const out = walkRoute([-10, 0, -1], [-6, 0, 9.2], footprint)
    expect(out.slice(0, 2)).toEqual([DOOR.inside, DOOR.outside])
    expect(throughWall([[-10, 0, -1], ...out])).toBe(false)
    const back = walkRoute([-6, 0, 9.2], [-10, 0, -1], footprint)
    expect(back.slice(-3)).toEqual([DOOR.outside, DOOR.inside, [-10, 0, -1]])
    expect(throughWall([[-6, 0, 9.2], ...back])).toBe(false)
  })

  it('steps straight through the doorway when already lined up with it', () => {
    expect(walkRoute([-0.75, 0, 6.5], [-0.75, 0, 7.75], footprint)).toEqual([[-0.75, 0, 7.75]])
  })

  it('turns the corner of the building instead of cutting through it', () => {
    const route = walkRoute([0, 0, 9], [-13, 0, -4], footprint)
    expect(route).toHaveLength(2)
    expect(route[0][0]).toBeLessThan(footprint.minX)
    expect(route[0][2]).toBeGreaterThan(FACADE_Z)
    expect(throughWall([[0, 0, 9], ...route])).toBe(false)
  })

  it('takes everyone in the overflowing queue to their place without crossing a wall', () => {
    const count = 4
    const half = hallWidth(count) / 2
    const hall: Rect = { minX: -half, maxX: half, minZ: -11, maxZ: FACADE_Z }
    const lane = queueSlot(0, count, MAX_INSIDE - 1)
    for (let k = 0; k < 40; k += 3) {
      const spot = queueSlot(0, count, MAX_INSIDE + k)
      expect(throughWall([lane, ...walkRoute(lane, spot, hall)], hall)).toBe(false)
      expect(throughWall([spot, ...walkRoute(spot, lane, hall)], hall)).toBe(false)
    }
  })
})
