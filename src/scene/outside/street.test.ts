import { describe, expect, it } from 'vitest'
import type { Rect } from '@/types/outside'
import { DOOR, FACADE_Z } from '../layout'
import { queueSlot } from '../queueLanes'
import { CAR_LANES, PLATFORM, RAMP, ROAD, ROAD_Y, SIDEWALK_Y, STEPS, groundHeight } from './street'

const footprint: Rect = { minX: -10, maxX: 10, minZ: -11, maxZ: FACADE_Z }

describe('groundHeight', () => {
  it('keeps the hall and the porch level with the floor', () => {
    expect(groundHeight(0, 0, footprint)).toBe(0)
    expect(groundHeight(...([DOOR.outside[0], DOOR.outside[2]] as const), footprint)).toBe(0)
    expect(groundHeight(PLATFORM.minX, PLATFORM.maxZ - 0.01, footprint)).toBe(0)
  })

  it('walks down the steps one rise at a time to the sidewalk', () => {
    const heights = [0.1, 0.5, 0.9].map(dz => groundHeight(0, STEPS.minZ + dz, footprint))
    expect(heights[0]).toBeGreaterThan(heights[1])
    expect(heights[1]).toBeGreaterThan(heights[2])
    expect(heights[2]).toBeCloseTo(SIDEWALK_Y)
    expect(groundHeight(0, STEPS.maxZ + 0.5, footprint)).toBe(SIDEWALK_Y)
  })

  it('slopes the ramp gently from the porch to the sidewalk', () => {
    const z = (RAMP.minZ + RAMP.maxZ) / 2
    expect(groundHeight(RAMP.minX + 0.01, z, footprint)).toBeCloseTo(0, 1)
    expect(groundHeight(RAMP.maxX, z, footprint)).toBeCloseTo(SIDEWALK_Y)
    expect(-SIDEWALK_Y / (RAMP.maxX - RAMP.minX)).toBeLessThanOrEqual(1 / 12 + 1e-9)
  })

  it('drops the road below the curb and keeps the side alley at sidewalk level', () => {
    expect(groundHeight(0, (ROAD.near + ROAD.far) / 2, footprint)).toBe(ROAD_Y)
    expect(groundHeight(-12, 0, footprint)).toBe(SIDEWALK_Y)
  })

  it('walks the overflowing lanes down the ramp and the steps onto the sidewalk, never onto the road', () => {
    const lengths = [90, 90, 90, 90]
    const lanes = [0, 1, 2, 3].map(i => Array.from({ length: 90 }, (_, slot) => queueSlot(i, 4, slot, lengths)).filter(([, , z]) => z > FACADE_Z))
    expect(lanes.flat().every(([, , z]) => z < ROAD.near - 2)).toBe(true)
    const ramp = lanes[3].filter(([x]) => x > RAMP.minX && x < RAMP.maxX)
    expect(ramp.length).toBeGreaterThan(3)
    expect(ramp.every(([, , z]) => z > RAMP.minZ && z < RAMP.maxZ)).toBe(true)
    for (const lane of lanes.slice(0, 3)) {
      const off = lane.filter(([x]) => x > RAMP.maxX)
      expect(off.length).toBeGreaterThan(3)
      expect(off.every(([x, , z]) => groundHeight(x, z, footprint) === SIDEWALK_Y)).toBe(true)
    }
  })
})

describe('car lanes', () => {
  it('drives on the right: the lane nearer the building heads to -x', () => {
    const [near, far] = [...CAR_LANES].sort((a, b) => a.z - b.z)
    expect(near.direction).toBe(-1)
    expect(far.direction).toBe(1)
    expect(CAR_LANES.every(lane => lane.z > ROAD.near && lane.z < ROAD.far)).toBe(true)
  })
})
