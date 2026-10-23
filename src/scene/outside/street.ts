import type { CarLane, Rect } from '@/types/outside'
import { ENTRANCE_HALF, FACADE_Z } from '../layout'

export const SIDEWALK_Y = -0.45
export const CURB_HEIGHT = 0.15
export const ROAD_Y = SIDEWALK_Y - CURB_HEIGHT
export const CURB_Z = FACADE_Z + 9
export const ROAD_WIDTH = 8
export const ROAD = { near: CURB_Z, far: CURB_Z + ROAD_WIDTH }
export const FAR_SIDEWALK = { near: ROAD.far, far: ROAD.far + 4 }
export const STREET_HALF_LENGTH = 110

const PLATFORM_HALF = ENTRANCE_HALF + 0.8
export const PLATFORM: Rect = { minX: -PLATFORM_HALF, maxX: PLATFORM_HALF, minZ: FACADE_Z, maxZ: FACADE_Z + 1.4 }
export const STEP_COUNT = 3
export const STEP_DEPTH = 0.4
export const STEP_RISE = -SIDEWALK_Y / STEP_COUNT
export const STEPS: Rect = { minX: PLATFORM.minX, maxX: PLATFORM.maxX, minZ: PLATFORM.maxZ, maxZ: PLATFORM.maxZ + STEP_COUNT * STEP_DEPTH }
export const RAMP: Rect = { minX: PLATFORM.maxX, maxX: PLATFORM.maxX + 5.4, minZ: FACADE_Z + 0.1, maxZ: FACADE_Z + 1.3 }

const LAMP_SPACING = 14
const FIRST_LAMP = 5.5
const LAMPS_PER_SIDE = 6
export const LAMP_Z = CURB_Z - 0.55
export const lampXs = () => Array.from({ length: LAMPS_PER_SIDE }, (_, i) => FIRST_LAMP + i * LAMP_SPACING).flatMap(x => [-x, x])

export const CAR_LANES: CarLane[] = [
  { z: ROAD.near + ROAD_WIDTH * 0.27, direction: -1 },
  { z: ROAD.near + ROAD_WIDTH * 0.73, direction: 1 },
]

const within = (x: number, z: number, rect: Rect) => x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ

// Floor height under a walker: the hall and the porch sit a few steps above the sidewalk.
export function groundHeight(x: number, z: number, footprint: Rect): number {
  if (within(x, z, footprint) || within(x, z, PLATFORM)) return 0
  if (within(x, z, STEPS)) return -STEP_RISE * Math.min(STEP_COUNT, Math.max(1, Math.ceil((z - STEPS.minZ) / STEP_DEPTH)))
  if (within(x, z, RAMP)) return SIDEWALK_Y * ((x - RAMP.minX) / (RAMP.maxX - RAMP.minX))
  if (z > ROAD.near && z < ROAD.far) return ROAD_Y
  return SIDEWALK_Y
}
