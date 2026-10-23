import type { CounterSplit } from '@/types/domain'
import type { ArrangedCounters, Rail, Vec3 } from '@/types/scene'

export const COUNTER_SPACING = 3.2
export const COUNTER_Z = -8
export const SERVICE_Z = -8.9
export const ATTENDANT_Z = -9.2
export const BACK_WALL_Z = -11
export const QUEUE_START_Z = -6.5
export const QUEUE_SPACING = 0.9
export const MAX_INSIDE = 7
export const LANE_HALF_WIDTH = 0.55
export const FACADE_Z = 7
// The front door is wide enough for the overflowing lanes to file out side by side next to the walkway.
export const ENTRANCE_HALF = 4
export const SIDE_MARGIN = 7
export const SIDEWALK_DEPTH = 24
export const WALL_HEIGHT = 7
export const FACING_COUNTER = Math.PI
export const FACING_HALL = 0

export const CLOSED_SPACING = COUNTER_SPACING
export const CORRIDOR_PAD = 1.2
export const CORRIDOR_WALL = 0.2

export const hallWidth = (count: number) => Math.max(1, count) * COUNTER_SPACING + SIDE_MARGIN * 2

export const corridorWidth = (closedCount: number) => (closedCount > 0 ? closedCount * CLOSED_SPACING + CORRIDOR_PAD * 2 : 0)

export const corridorStartX = (count: number) => hallWidth(count) / 2 + CORRIDOR_WALL

export const isClosedIndex = (index: number, count: number) => index >= Math.max(1, count) && count > 0

// Indexes past the hall count belong to the closed corridor, an annex beyond the right wall.
export function counterX(index: number, count: number): number {
  if (isClosedIndex(index, count)) return corridorStartX(count) + CORRIDOR_PAD + (index - count + 0.5) * CLOSED_SPACING
  return (index - (Math.max(1, count) - 1) / 2) * COUNTER_SPACING
}

export function arrangeCounters(split: CounterSplit, showClosed: boolean): ArrangedCounters {
  const closed = showClosed ? split.closed : []
  return { counters: [...split.visible, ...closed], hallCount: split.visible.length, closedCount: closed.length }
}

export function sceneBounds(count: number, closedCount: number): { minX: number; maxX: number } {
  const half = hallWidth(count) / 2
  return { minX: -half, maxX: closedCount > 0 ? corridorStartX(count) + corridorWidth(closedCount) : half }
}

const RAIL_PAD = 0.4

const rail = (x1: number, z1: number, x2: number, z2: number): Rail => ({ from: [x1, z1], to: [x2, z2] })

// Two rails along the lane, as long as the part of the line that is inside.
export function stanchionRails(index: number, count: number, length: number): Rail[] {
  const inside = Math.min(length, MAX_INSIDE)
  if (inside < 2) return []
  const x = counterX(index, count)
  const top = QUEUE_START_Z - RAIL_PAD
  const bottom = QUEUE_START_Z + (inside - 1) * QUEUE_SPACING + RAIL_PAD
  return [rail(x - LANE_HALF_WIDTH, top, x - LANE_HALF_WIDTH, bottom), rail(x + LANE_HALF_WIDTH, top, x + LANE_HALF_WIDTH, bottom)]
}

export function attendantSpot(index: number, count: number, seat: number, seats: number): Vec3 {
  return [counterX(index, count) + (seat - (seats - 1) / 2) * 0.9, 0, ATTENDANT_Z]
}

export const serviceSpot = (index: number, count: number): Vec3 => [counterX(index, count), 0, SERVICE_Z]

export function copaSpot(slot: number, count: number): Vec3 {
  const left = -hallWidth(count) / 2 + 1.5
  return [left + (slot % 3) * 1.1, 0, -6 + Math.floor(slot / 3) * 1.1]
}

export function waitingSeat(slot: number, count: number): Vec3 {
  const right = hallWidth(count) / 2 - 1.5
  return [right - (slot % 4), 0, -5 + Math.floor(slot / 4) * 1.3]
}

export const doorSpot = (): Vec3 => [0, 0, FACADE_Z + 2]
export const DOOR: { outside: Vec3; inside: Vec3 } = { outside: [0, 0, FACADE_Z + 1], inside: [0, 0, FACADE_Z - 1.5] }
export const SIDEWALK = { near: FACADE_Z + 3, far: FACADE_Z + 8, minHalfWidth: 8 }
export const totemSpot = (): Vec3 => [ENTRANCE_HALF + 1.6, 0, FACADE_Z - 1.2]
// The lobby is the open floor between the queues and the front wall.
export const LOBBY_BACK_Z = 1

export const backDoorSpot = (count: number): Vec3 => [hallWidth(count) / 2 - 2.5, 0, BACK_WALL_Z + 0.6]

export type CameraGoal = { position: Vec3; target: Vec3 }

export const CAMERA_FOV = 40
export const OVERVIEW_PITCH = (40 * Math.PI) / 180
const FIT_MARGIN = 0.94
const FIT_STEP = 1.03
const FIT_PAD = 1.2
const SIGN_TOP = 4.8
const HEAD = 2.4

type View = { position: Vec3; target: Vec3 }

const overviewAt = (target: Vec3, distance: number): Vec3 =>
  [target[0], target[1] + Math.sin(OVERVIEW_PITCH) * distance, target[2] + Math.cos(OVERVIEW_PITCH) * distance]

function project(view: View, point: Vec3): { x: number; y: number; depth: number } {
  const forward: Vec3 = [0, -Math.sin(OVERVIEW_PITCH), -Math.cos(OVERVIEW_PITCH)]
  const up: Vec3 = [0, Math.cos(OVERVIEW_PITCH), -Math.sin(OVERVIEW_PITCH)]
  const v: Vec3 = [point[0] - view.position[0], point[1] - view.position[1], point[2] - view.position[2]]
  const depth = v[0] * forward[0] + v[1] * forward[1] + v[2] * forward[2]
  return { x: v[0], y: v[0] * up[0] + v[1] * up[1] + v[2] * up[2], depth }
}

export function inView(view: View, points: Vec3[], aspect: number, margin = FIT_MARGIN): boolean {
  const tanV = Math.tan((CAMERA_FOV * Math.PI) / 360) * margin
  const tanH = tanV * aspect
  return points.every(point => {
    const { x, y, depth } = project(view, point)
    return depth > 0 && Math.abs(x) / depth < tanH && Math.abs(y) / depth < tanV
  })
}

export const OVERVIEW_NEAR_Z = FACADE_Z - 2

// Frames the counters (and the closed corridor when shown) down to the front of the lobby.
export function overviewCamera(count: number, aspect = 16 / 10, closedCount = 0): CameraGoal {
  const first = counterX(0, count) - COUNTER_SPACING / 2 - FIT_PAD
  const last = closedCount > 0 ? counterX(count + closedCount - 1, count) + CLOSED_SPACING / 2 + FIT_PAD : -first
  const centerX = (first + last) / 2
  const nearZ = OVERVIEW_NEAR_Z
  const target: Vec3 = [centerX, 0.6, (COUNTER_Z + nearZ) / 2]
  const points: Vec3[] = [
    [first, SIGN_TOP, COUNTER_Z],
    [last, SIGN_TOP, COUNTER_Z],
    [first, 0, COUNTER_Z],
    [last, 0, COUNTER_Z],
    [first + COUNTER_SPACING / 2, 0, nearZ],
    [last - COUNTER_SPACING / 2, 0, nearZ],
    [centerX, HEAD, nearZ],
  ]
  let distance = 8
  while (!inView({ position: overviewAt(target, distance), target }, points, aspect)) distance *= FIT_STEP
  return { position: overviewAt(target, distance), target }
}

export function counterCamera(index: number, count: number): CameraGoal {
  const x = counterX(index, count)
  return { position: [x, 6.2, COUNTER_Z + 10.5], target: [x, 1.6, COUNTER_Z + 1.2] }
}
