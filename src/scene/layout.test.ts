import { describe, expect, it } from 'vitest'
import type { Vec3 } from '@/types/scene'
import { counter } from '@/domain/testFactories'
import { BACK_WALL_Z, CAMERA_FOV, COUNTER_SPACING, FACADE_Z, LANE_HALF_WIDTH, LOBBY_BACK_Z, MAX_INSIDE, OVERVIEW_NEAR_Z, arrangeCounters, copaSpot, corridorStartX, counterX, inView, doorSpot, hallWidth, isClosedIndex, overviewCamera, sceneBounds, stanchionRails, totemSpot, waitingSeat } from './layout'
import { queueSlot } from './queueLanes'

describe('layout', () => {
  it('centres counters and survives zero counters', () => {
    expect([0, 1, 2].map(i => counterX(i, 3))).toEqual([-COUNTER_SPACING, 0, COUNTER_SPACING])
    expect(counterX(0, 0)).toBe(0)
    expect(Number.isFinite(hallWidth(0))).toBe(true)
  })

  it('leaves room for the copa and the waiting room beside the counters', () => {
    const count = 16
    expect(copaSpot(5, count)[0]).toBeLessThan(counterX(0, count) - 2)
    expect(waitingSeat(11, count)[0]).toBeGreaterThan(counterX(count - 1, count) + 2)
  })

  it('puts the door outside and the totem inside', () => {
    expect(doorSpot()[2]).toBeGreaterThan(FACADE_Z)
    expect(totemSpot()[2]).toBeLessThan(FACADE_Z)
  })
})

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unit = (a: Vec3): Vec3 => {
  const length = Math.hypot(...a)
  return [a[0] / length, a[1] / length, a[2] / length]
}

function horizontalSpread(count: number, aspect: number, closedCount = 0) {
  const { position, target } = overviewCamera(count, aspect, closedCount)
  const forward = unit(sub(target, position))
  const right = unit([-forward[2], 0, forward[0]])
  const first = counterX(0, count) - 1.5
  const last = counterX(count + closedCount - 1, count) + 1.5
  const corners: Vec3[] = [[first, 0, 0], [last, 0, 0], [first, 0, BACK_WALL_Z], [last, 0, BACK_WALL_Z]]
  return Math.max(...corners.map(corner => {
    const v = sub(corner, position)
    return Math.abs(dot(v, right)) / dot(v, forward)
  }))
}

describe('closed corridor', () => {
  const visible = [counter({ repo: 'a' }), counter({ repo: 'b' })]
  const closed = [counter({ repo: 'c' }), counter({ repo: 'd' })]

  it('lays out only the active counters by default', () => {
    expect(arrangeCounters({ visible, closed }, false)).toEqual({ counters: visible, hallCount: 2, closedCount: 0 })
  })

  it('appends the closed counters after the hall ones when shown', () => {
    const arranged = arrangeCounters({ visible, closed }, true)
    expect(arranged.counters.map(c => c.repo)).toEqual(['a', 'b', 'c', 'd'])
    expect(arranged).toMatchObject({ hallCount: 2, closedCount: 2 })
  })

  it('puts indexes past the hall count beyond the right wall, in order', () => {
    expect(isClosedIndex(1, 2)).toBe(false)
    expect(isClosedIndex(2, 2)).toBe(true)
    const xs = [2, 3].map(i => counterX(i, 2))
    expect(xs[0]).toBeGreaterThan(corridorStartX(2))
    expect(xs[1]).toBeGreaterThan(xs[0])
    expect(queueSlot(2, 2, 0)[0]).toBe(xs[0])
  })

  it('widens the scene bounds only when the corridor is shown', () => {
    expect(sceneBounds(2, 0)).toEqual({ minX: -hallWidth(2) / 2, maxX: hallWidth(2) / 2 })
    expect(sceneBounds(2, 2).maxX).toBeGreaterThan(counterX(3, 2))
  })
})

describe('overviewCamera', () => {
  const limit = (aspect: number) => Math.tan((CAMERA_FOV * Math.PI) / 360) * aspect

  it('fits every counter in a narrow window, closed corridor included', () => {
    for (const aspect of [1148 / 1064, 0.75, 16 / 9]) {
      expect(horizontalSpread(10, aspect)).toBeLessThan(limit(aspect))
      expect(horizontalSpread(10, aspect, 4)).toBeLessThan(limit(aspect))
    }
  })

  it('keeps every lane and the front of the lobby in view', () => {
    const view = overviewCamera(10, 16 / 10)
    const tails = [0, 9].flatMap(i => [queueSlot(i, 10, 0), queueSlot(i, 10, MAX_INSIDE - 1)])
    expect(inView(view, [...tails, [-5, 0, OVERVIEW_NEAR_Z], [5, 0, OVERVIEW_NEAR_Z]], 16 / 10, 1)).toBe(true)
  })

  it('looks down at roughly 40 degrees', () => {
    const { position, target } = overviewCamera(10)
    const pitch = Math.atan2(position[1] - target[1], position[2] - target[2])
    expect(pitch).toBeGreaterThan((35 * Math.PI) / 180)
    expect(pitch).toBeLessThan((45 * Math.PI) / 180)
  })

  it('comes closer on wider windows', () => {
    const distance = (aspect: number) => {
      const { position, target } = overviewCamera(10, aspect)
      return Math.hypot(...sub(position, target))
    }
    expect(distance(16 / 9)).toBeLessThan(distance(0.75))
  })
})

describe('stanchion rails', () => {
  it('draws two rails for a short line and none for one person', () => {
    expect(stanchionRails(0, 1, 1)).toEqual([])
    expect(stanchionRails(0, 1, 4)).toHaveLength(2)
  })

  it('sizes the lane to the line and stops at the lobby', () => {
    const rails = stanchionRails(0, 1, MAX_INSIDE + 20)
    expect(rails).toHaveLength(2)
    expect(rails.map(r => r.from[0] - counterX(0, 1))).toEqual([-LANE_HALF_WIDTH, LANE_HALF_WIDTH])
    const zs = rails.flatMap(r => [r.from[1], r.to[1]])
    expect(Math.min(...zs)).toBeLessThan(queueSlot(0, 1, 0)[2])
    expect(Math.max(...zs)).toBeLessThan(LOBBY_BACK_Z)
    const short = stanchionRails(0, 1, 3).flatMap(r => [r.to[1]])
    expect(Math.max(...short)).toBeLessThan(queueSlot(0, 1, 3)[2])
  })
})
