import { describe, expect, it } from 'vitest'
import { priorityLane } from '@/scene/hall/lobbyLayout'
import { DOOR, MAX_INSIDE, totemSpot } from '@/scene/layout'
import { occupiedPath, queueLanes, queueSlot } from '@/scene/queueLanes'
import type { Vec3 } from '@/types/scene'
import { DOG_BED, LOVE_WINDOW_MS, dogZone, isFree, nextActivity, pathClear, registerClick, restSpot, wanderTarget } from './caramelo'

const sequence = (values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

describe('caramelo, the office dog', () => {
  const lengths = [30, 12, 3]
  const lanes = queueLanes(lengths, 10)
  const zone = dogZone(10, lanes.map((lane, i) => occupiedPath(lane, lengths[i] ?? 0)))

  it('keeps off the priority corner, the totem and the lines winding to the door', () => {
    const { sign } = priorityLane(10)
    for (const slot of [MAX_INSIDE + 1, MAX_INSIDE + 8, 24]) {
      const [x, , z] = queueSlot(0, 10, slot, lengths)
      expect(isFree(zone, x, z)).toBe(false)
    }
    expect(isFree(zone, sign[0], sign[2])).toBe(false)
    expect(isFree(zone, -10, 4.6)).toBe(false)
    expect(isFree(zone, totemSpot()[0], totemSpot()[2])).toBe(false)
    expect(isFree(zone, 0, -3)).toBe(false)
    expect(isFree(zone, -4, 2.5)).toBe(true)
  })

  it('refuses paths through the priority lane', () => {
    expect(pathClear(zone, [-6, 0, 4], [-6, 0, 5.5])).toBe(false)
    expect(pathClear(zone, [-10, 0, 2.5], [-1, 0, 2.5])).toBe(true)
    expect(pathClear(zone, [-10, 0, 2.5], [-10, 0, -0.5])).toBe(false)
  })

  it('wanders to a free spot it can reach in a straight line', () => {
    const from: Vec3 = [-4, 0, 2.5]
    for (let seed = 1; seed < 30; seed++) {
      let state = seed
      const random = () => ((state = (state * 16807) % 2147483647) / 2147483647)
      const target = wanderTarget(zone, from, random)
      expect(isFree(zone, target[0], target[2])).toBe(true)
      expect(pathClear(zone, from, target)).toBe(true)
    }
  })

  it('stays put when nothing is reachable', () => {
    const walled = { ...zone, blocked: [{ minX: -99, maxX: 99, minZ: -99, maxZ: 99 }] }
    expect(wanderTarget(walled, [0, 0, 1], sequence([0.5]))).toEqual([0, 0, 1])
  })

  it('sleeps in a bed on free floor beside the door', () => {
    expect(DOG_BED[0]).toBeLessThan(DOOR.inside[0] - 1.6)
    expect(isFree(dogZone(1), DOG_BED[0], DOG_BED[2])).toBe(true)
    expect(isFree(zone, DOG_BED[0], DOG_BED[2])).toBe(true)
  })

  it('only visits the oldest PR when there is one', () => {
    expect(nextActivity(() => 0.1, true)).toBe('visit')
    expect(nextActivity(() => 0.1, false)).toBe('wander')
    expect(nextActivity(() => 0.25, true)).toBe('nap')
    expect(nextActivity(() => 0.4, true)).toBe('sit')
    expect(nextActivity(() => 0.9, true)).toBe('wander')
    expect(restSpot([1, 0, -2])).toEqual([1.55, 0, -1.55])
  })

  it('falls in love after five quick clicks', () => {
    let state = { clicks: [] as number[], love: false }
    for (let i = 0; i < 4; i++) state = registerClick(state.clicks, i * 1000)
    expect(state.love).toBe(false)
    expect(registerClick(state.clicks, 4000)).toEqual({ clicks: [], love: true })
    expect(registerClick(state.clicks, 4 * 1000 + LOVE_WINDOW_MS).love).toBe(false)
  })
})
