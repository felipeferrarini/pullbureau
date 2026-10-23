import type { FloorPoint, LaneTape, QueueLane, QueuePlace, Rail } from '@/types/scene'
import { PLATFORM, RAMP, STEPS } from './outside/street'
import { ENTRANCE_HALF, FACADE_Z, FACING_COUNTER, MAX_INSIDE, QUEUE_SPACING, QUEUE_START_Z, counterX, isClosedIndex, sceneBounds } from './layout'

// Where the overflowing lanes cross the front wall, right of the walkway through the middle of the door.
export const DOOR_LANES = { first: 0.8, last: ENTRANCE_HALF - 0.3 }
export const LANE_PITCH = 0.8
const ROW_PITCH = 1.05
// Inside, the lanes turn towards the door in rows between the counter lanes and the benches.
export const TURN_ROWS = { first: 0, last: 3.2 }
// Outside, the first row goes down the ramp, the second along the steps, the rest along the sidewalk.
export const OUTSIDE_ROWS = [FACADE_Z + 0.7, FACADE_Z + 1.85, FACADE_Z + 2.85]
export const OUTSIDE_PITCH = 0.75
export const CORNER_PAD = 1.2
const CLOSED_FRONT_Z = 2
const CLOSED_FOLD = 1.1
const FAR_AWAY = 1000

const laneTail = QUEUE_START_Z + (MAX_INSIDE - 1) * QUEUE_SPACING

const pitchFor = (count: number, span: number, pitch: number) => (count > 1 ? Math.min(pitch, span / (count - 1)) : 0)

export const outsideRowZ = (row: number) =>
  row < OUTSIDE_ROWS.length ? OUTSIDE_ROWS[row] : OUTSIDE_ROWS[OUTSIDE_ROWS.length - 1] + (row - OUTSIDE_ROWS.length + 1) * OUTSIDE_PITCH

const turnRowZ = (row: number, rows: number) =>
  TURN_ROWS.first + row * pitchFor(rows, TURN_ROWS.last - TURN_ROWS.first, ROW_PITCH)

export const overflows = (length: number) => length > MAX_INSIDE

function straightLane(index: number, count: number): QueueLane {
  const x = counterX(index, count)
  return { index, points: [[x, QUEUE_START_Z], [x, laneTail]], door: null, row: null }
}

// Abandoned counters fold their line back inside the closed corridor.
function closedLane(index: number, count: number): QueueLane {
  const x = counterX(index, count)
  const fold = x + CLOSED_FOLD
  return { index, points: [[x, QUEUE_START_Z], [x, CLOSED_FRONT_Z], [fold, CLOSED_FRONT_Z], [fold, QUEUE_START_Z]], door: null, row: null }
}

type DoorLane = { index: number; x: number; door: number; row: number }

// Nested corners never cross: on each side of the door, the lane from the farthest counter turns last.
function turnZ(lanes: DoorLane[], at: number): number {
  const lane = lanes[at]
  const left = lanes.filter(other => other.x < other.door)
  const right = lanes.filter(other => other.x > other.door)
  const rows = Math.max(left.length, right.length)
  if (lane.x < lane.door) return turnRowZ(left.length - 1 - left.indexOf(lane), rows)
  if (lane.x > lane.door) return turnRowZ(right.indexOf(lane), rows)
  return TURN_ROWS.first
}

function doorLane(lanes: DoorLane[], at: number, cornerX: number): QueueLane {
  const { index, x, door, row } = lanes[at]
  const turn = turnZ(lanes, at)
  const outZ = outsideRowZ(row)
  const corner = cornerX + row * OUTSIDE_PITCH
  return {
    index,
    points: [[x, QUEUE_START_Z], [x, turn], [door, turn], [door, outZ], [corner, outZ], [corner, -FAR_AWAY]],
    door,
    row,
  }
}

// One continuous line per counter: straight to the front of its lane, then (when it overflows) towards the
// door, out through it beside the other overflowing lanes, along the sidewalk and round the corner.
export function queueLanes(lengths: number[], count: number, closedCount = 0): QueueLane[] {
  const hall = lengths.map((length, index) => ({ length, index })).filter(({ length, index }) => overflows(length) && !isClosedIndex(index, count))
  const pitch = pitchFor(hall.length, DOOR_LANES.last - DOOR_LANES.first, LANE_PITCH)
  const doorLanes: DoorLane[] = hall.map(({ index }, j) => ({ index, x: counterX(index, count), door: DOOR_LANES.first + j * pitch, row: hall.length - 1 - j }))
  const cornerX = sceneBounds(count, closedCount).maxX + CORNER_PAD
  const byIndex = new Map(doorLanes.map((lane, at) => [lane.index, doorLane(doorLanes, at, cornerX)]))
  return lengths.map((length, index) => {
    if (isClosedIndex(index, count)) return overflows(length) ? closedLane(index, count) : straightLane(index, count)
    return byIndex.get(index) ?? straightLane(index, count)
  })
}

export const laneFor = (lanes: QueueLane[], index: number, count: number) => lanes[index] ?? straightLane(index, count)

const facingBack = (from: FloorPoint, to: FloorPoint) => Math.atan2(from[0] - to[0], from[1] - to[1])

// Slot i stands i spacings along the lane, facing the one ahead of them; past the end the last stretch goes on.
export function lanePlace(lane: QueueLane, slot: number): QueuePlace {
  const { points } = lane
  let left = slot * QUEUE_SPACING
  for (let i = 1; i < points.length; i++) {
    const [from, to] = [points[i - 1], points[i]]
    const length = Math.hypot(to[0] - from[0], to[1] - from[1])
    if (length === 0) continue
    if (left <= length || i === points.length - 1) {
      const k = left / length
      return { position: [from[0] + (to[0] - from[0]) * k, 0, from[1] + (to[1] - from[1]) * k], facing: facingBack(from, to) }
    }
    left -= length
  }
  return { position: [points[0][0], 0, points[0][1]], facing: FACING_COUNTER }
}

// The piece of the lane between two distances from its head.
export function lanePath(lane: QueueLane, start: number, end: number): FloorPoint[] {
  const at = (from: FloorPoint, to: FloorPoint, k: number): FloorPoint => [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k]
  const path: FloorPoint[] = []
  let walked = 0
  for (let i = 1; i < lane.points.length; i++) {
    const [from, to] = [lane.points[i - 1], lane.points[i]]
    const length = Math.hypot(to[0] - from[0], to[1] - from[1])
    const last = i === lane.points.length - 1
    if (length > 0 && walked + length >= start && walked <= end) {
      if (!path.length) path.push(at(from, to, (start - walked) / length))
      if (walked + length >= end || last) {
        path.push(at(from, to, (end - walked) / length))
        return path
      }
      path.push(to)
    }
    walked += length
  }
  return path.length ? path : [lane.points[0]]
}

// The stretch of the lane people stand on, from the head to the last one in line.
export const occupiedPath = (lane: QueueLane, length: number) => lanePath(lane, 0, Math.max(0, length - 1) * QUEUE_SPACING)

export const queuePlace = (index: number, count: number, slot: number, lengths: number[] = [], closedCount = 0): QueuePlace =>
  lanePlace(laneFor(queueLanes(lengths, count, closedCount), index, count), slot)

export const queueSlot = (index: number, count: number, slot: number, lengths: number[] = [], closedCount = 0) =>
  queuePlace(index, count, slot, lengths, closedCount).position

// A newcomer joins the end of their own counter's line, wherever it has got to.
export function backOfLine(index: number, count: number, lengths: number[], closedCount = 0): QueuePlace {
  const grown = lengths.map((length, i) => (i === index ? length + 1 : length))
  return queuePlace(index, count, lengths[index] ?? 0, grown, closedCount)
}

const LANE_COLORS = ['#d8453b', '#2f7fd8', '#e0a526', '#3aa76d', '#9b59b6', '#e67e22', '#16a3a8', '#c2185b', '#7f8c3a', '#5d6d7e']
const TAPE_OFFSET = LANE_PITCH / 2
const TAPE_PAST_END = 0.9

export const laneColor = (index: number) => LANE_COLORS[index % LANE_COLORS.length]

// The tape starts where its row reaches level sidewalk: past the ramp, past the steps, or right out of the door.
function tapeStart(lane: QueueLane, tapeZ: number): number {
  const door = (lane.door ?? 0) + TAPE_OFFSET
  if (tapeZ < RAMP.maxZ) return RAMP.maxX + TAPE_OFFSET
  if (tapeZ < STEPS.maxZ) return Math.max(door, PLATFORM.maxX + TAPE_OFFSET)
  return door
}

// Coloured tape on the street side of each outside row, up to the last one in line (or the corner), with the
// counter's sign on its first post.
export function laneTapes(lanes: QueueLane[], lengths: number[]): LaneTape[] {
  return lanes.flatMap((lane, i) => {
    if (lane.row === null) return []
    const z = outsideRowZ(lane.row)
    const onRow = occupiedPath(lane, lengths[i] ?? 0).filter(([, pz]) => pz === z)
    if (!onRow.length) return []
    const tapeZ = z + TAPE_OFFSET
    const from = tapeStart(lane, tapeZ)
    const to = Math.min(lane.points[4][0], Math.max(...onRow.map(([x]) => x)) + TAPE_PAST_END)
    if (to <= from + TAPE_OFFSET) return []
    return [{ index: lane.index, color: laneColor(lane.index), rail: { from: [from, tapeZ], to: [to, tapeZ] }, sign: [from, tapeZ] }]
  })
}

const ROPE_PAD = 0.4
const ROPE_FRONT = FACADE_Z - 0.3
const ROPE_START = (MAX_INSIDE - 1) * QUEUE_SPACING + ROPE_PAD

function distanceTo(lane: QueueLane, z: number): number {
  let walked = 0
  for (let i = 1; i < lane.points.length; i++) {
    const [from, to] = [lane.points[i - 1], lane.points[i]]
    const length = Math.hypot(to[0] - from[0], to[1] - from[1])
    if (i > 2 && from[1] < z && to[1] >= z) return walked + ((z - from[1]) / (to[1] - from[1])) * length
    walked += length
  }
  return walked
}

const withoutRepeats = (path: FloorPoint[]) => path.filter((p, i) => i === 0 || Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) > 1e-6)

// Shifts a path of right-angle turns sideways (left of the walking direction when `by` > 0).
function offsetPath(path: FloorPoint[], by: number): FloorPoint[] {
  const points = withoutRepeats(path)
  if (points.length < 2) return []
  const normals = points.slice(1).map((to, i): FloorPoint => {
    const from = points[i]
    const length = Math.hypot(to[0] - from[0], to[1] - from[1])
    return [-(to[1] - from[1]) / length, (to[0] - from[0]) / length]
  })
  return points.map((p, i) => {
    const before = normals[i - 1] ?? normals[i]
    const after = normals[i] ?? normals[i - 1]
    const same = before[0] === after[0] && before[1] === after[1]
    const [nx, nz] = same ? before : [before[0] + after[0], before[1] + after[1]]
    return [p[0] + nx * by, p[1] + nz * by]
  })
}

const toRails = (path: FloorPoint[]): Rail[] => path.slice(1).map((to, i) => ({ from: path[i], to }))

// Ropes between the lanes that wind across the lobby: one between each pair and one on each open side.
export function laneRopes(lanes: QueueLane[], lengths: number[]): Rail[] {
  const turning = lanes.filter(lane => lane.door !== null)
  const left = turning.filter(lane => lane.points[0][0] <= (lane.door ?? 0))
  const right = turning.filter(lane => lane.points[0][0] > (lane.door ?? 0))
  const innermost = new Set([left.at(-1), right[0]].filter(Boolean))
  const offset = (turning.length > 1 ? pitchFor(turning.length, DOOR_LANES.last - DOOR_LANES.first, LANE_PITCH) : LANE_PITCH) / 2
  return turning.flatMap(lane => {
    const end = Math.min((Math.max(0, (lengths[lane.index] ?? 0) - 1)) * QUEUE_SPACING + ROPE_PAD, distanceTo(lane, ROPE_FRONT))
    if (end <= ROPE_START) return []
    const path = lanePath(lane, ROPE_START, end)
    const side = right.includes(lane) ? -1 : 1
    const sides = innermost.has(lane) ? [side, -side] : [side]
    return sides.flatMap(sign => toRails(offsetPath(path, sign * offset)))
  })
}
