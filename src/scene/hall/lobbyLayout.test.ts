import { describe, expect, it } from 'vitest'
import type { FloorRect, Vec3 } from '@/types/scene'
import { DOOR, FACADE_Z, LOBBY_BACK_Z, MAX_INSIDE, hallWidth, totemSpot } from '../layout'
import { queueSlot } from '../queueLanes'
import { lobbyPlants, priorityBenches, priorityCorner, priorityLane, waitingBenches } from './lobbyLayout'

const inside = (rect: FloorRect, [x, , z]: Vec3) => x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ

function crosses(rects: FloorRect[], from: Vec3, to: Vec3): boolean {
  const steps = Math.ceil(Math.hypot(to[0] - from[0], to[2] - from[2]) / 0.1)
  return Array.from({ length: steps + 1 }, (_, i): Vec3 => {
    const k = i / steps
    return [from[0] + (to[0] - from[0]) * k, 0, from[2] + (to[2] - from[2]) * k]
  }).some(point => rects.some(rect => inside(rect, point)))
}

describe('lobby', () => {
  it('mirrors the waiting benches with a smaller priority corner on the left', () => {
    expect(waitingBenches(10).every(bench => bench.position[0] > 0)).toBe(true)
    const priority = priorityBenches(10)
    expect(priority).toHaveLength(4)
    expect(priority.every(bench => bench.position[0] < -8 && bench.position[0] > -hallWidth(10) / 2 + 1)).toBe(true)
    expect(priorityBenches(3)).toEqual([])
  })

  it('keeps the priority lane inside the lobby and the hall walls', () => {
    for (const count of [1, 4, 10]) {
      const lane = priorityLane(count)
      const points = lane.rails.flatMap(rail => [rail.from, rail.to])
      expect(points.every(([x, z]) => z > LOBBY_BACK_Z && z < FACADE_Z - 0.5 && x < -2 && x > -hallWidth(count) / 2)).toBe(true)
      expect(lane.sign[0]).toBeLessThan(-2)
    }
  })

  it('leaves the walk from the door and the totem to every queue clear', () => {
    for (const count of [3, 10]) {
      const corner = priorityCorner(count)
      const places = Array.from({ length: count }, (_, i) => Array.from({ length: MAX_INSIDE }, (_, slot) => queueSlot(i, count, slot))).flat()
      const lineHead = queueSlot(0, count, MAX_INSIDE)
      for (const place of places) {
        expect(crosses(corner, DOOR.inside, place)).toBe(false)
        expect(crosses(corner, totemSpot(), place)).toBe(false)
        expect(crosses(corner, lineHead, place)).toBe(false)
      }
    }
  })

  it('puts plants on both sides of the door', () => {
    const xs = lobbyPlants(10).map(plant => plant.position[0])
    expect(xs.filter(x => x < 0).length).toBeGreaterThanOrEqual(3)
    expect(xs.filter(x => x > 0).length).toBeGreaterThanOrEqual(3)
  })
})
