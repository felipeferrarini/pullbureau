import type { Rect } from '@/types/outside'
import type { Vec3 } from '@/types/scene'
import { BACK_WALL_Z, DOOR, ENTRANCE_HALF, FACADE_Z } from './layout'

export const DEFAULT_FOOTPRINT: Rect = { minX: -10, maxX: 10, minZ: BACK_WALL_Z, maxZ: FACADE_Z }

const DOOR_HALF = ENTRANCE_HALF - 0.3
const CORNER_PAD = 0.9
const SAMPLE = 0.2

type Side = 'left' | 'right' | 'front'

export const indoors = ([x, , z]: Vec3, f: Rect) => x > f.minX && x < f.maxX && z > f.minZ && z < f.maxZ

function throughDoor(from: Vec3, to: Vec3, f: Rect): boolean {
  if ((from[2] - f.maxZ) * (to[2] - f.maxZ) > 0) return false
  if (from[2] === to[2]) return Math.abs(from[0]) < DOOR_HALF
  const k = (f.maxZ - from[2]) / (to[2] - from[2])
  return Math.abs(from[0] + (to[0] - from[0]) * k) < DOOR_HALF
}

function hitsBuilding(from: Vec3, to: Vec3, f: Rect): boolean {
  const steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[2] - from[2]) / SAMPLE))
  for (let i = 1; i < steps; i++) {
    const k = i / steps
    if (indoors([from[0] + (to[0] - from[0]) * k, 0, from[2] + (to[2] - from[2]) * k], f)) return true
  }
  return false
}

const sideOf = ([x, , z]: Vec3, f: Rect): Side => (z >= f.maxZ ? 'front' : x <= f.minX ? 'left' : x >= f.maxX ? 'right' : 'front')

const cornerOf = (side: 'left' | 'right', f: Rect): Vec3 =>
  side === 'left' ? [f.minX - CORNER_PAD, 0, f.maxZ + CORNER_PAD] : [f.maxX + CORNER_PAD, 0, f.maxZ + CORNER_PAD]

// Outdoors, the way round the building goes past its front corners.
function aroundBuilding(from: Vec3, to: Vec3, f: Rect): Vec3[] {
  if (!hitsBuilding(from, to, f)) return [to]
  const start = sideOf(from, f)
  const end = sideOf(to, f)
  const corners: Vec3[] = []
  if (start !== 'front') corners.push(cornerOf(start, f))
  if (end !== 'front' && end !== start) corners.push(cornerOf(end, f))
  return [...corners, to]
}

// Waypoints from one spot to another that never walk through a wall: in and out only by the front door.
export function walkRoute(from: Vec3, to: Vec3, footprint: Rect = DEFAULT_FOOTPRINT): Vec3[] {
  const startsIn = indoors(from, footprint)
  const endsIn = indoors(to, footprint)
  if (startsIn && endsIn) return [to]
  if (!startsIn && !endsIn) return aroundBuilding(from, to, footprint)
  if (throughDoor(from, to, footprint)) return [to]
  if (startsIn) return [DOOR.inside, DOOR.outside, ...aroundBuilding(DOOR.outside, to, footprint)]
  return [...aroundBuilding(from, DOOR.outside, footprint), DOOR.inside, to]
}
