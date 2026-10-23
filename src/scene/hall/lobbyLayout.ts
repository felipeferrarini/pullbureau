import type { FloorRect, PropPlacement, Rail, Vec3 } from '@/types/scene'
import { ENTRANCE_HALF, FACADE_Z, hallWidth } from '../layout'

const FACING_COUNTERS = Math.PI
const BENCH_STEP = 2.4
const BENCH_ROWS = [4, 5.3]
const FIRST_BENCH_X = 6.2
const PRIORITY_BENCH_X = 9.8
const MAX_BENCH_COLUMNS = 3
const MAX_PRIORITY_COLUMNS = 2
const WALL_CLEARANCE = 6.5
const PLANT_Z = 4.65
const DOOR_PLANT_X = ENTRANCE_HALF + 0.7
const SIDE_WALL_GAP = 1.2

const LANE_MOUTH_X = -4.4
const LANE_END_X = -8.4
const LANE_Z = [4.9, 5.9] as const
const OBSTACLE_PAD = 0.3

const around = ([x, , z]: Vec3, pad: number): FloorRect => ({ minX: x - pad, maxX: x + pad, minZ: z - pad, maxZ: z + pad })

function benchColumns(count: number, firstX: number, maxColumns: number): number[] {
  const limit = hallWidth(count) / 2 - WALL_CLEARANCE
  const xs: number[] = []
  for (let x = firstX; x <= limit && xs.length < maxColumns; x += BENCH_STEP) xs.push(x)
  return xs
}

const benchRows = (xs: number[]): PropPlacement[] => BENCH_ROWS.flatMap(z => xs.map(x => ({ position: [x, 0, z] as Vec3, rotation: FACING_COUNTERS })))

// Right of the door: the waiting benches.
export const waitingBenches = (count: number) => benchRows(benchColumns(count, FIRST_BENCH_X, MAX_BENCH_COLUMNS))

// Left of the door: a few priority benches, only where the hall is wide enough.
export const priorityBenches = (count: number) => benchRows(benchColumns(count, PRIORITY_BENCH_X, MAX_PRIORITY_COLUMNS).map(x => -x))

const laneEnd = (count: number) => Math.max(LANE_END_X, -hallWidth(count) / 2 + SIDE_WALL_GAP)

// An empty roped lane along the front wall that leads from the door to the priority benches.
export function priorityLane(count: number): { rails: Rail[]; sign: Vec3; floor: Vec3 } {
  const end = laneEnd(count)
  const [near, far] = LANE_Z
  return {
    rails: [
      { from: [LANE_MOUTH_X, near], to: [end, near] },
      { from: [LANE_MOUTH_X, far], to: [end, far] },
    ],
    sign: [LANE_MOUTH_X + 0.45, 0, near - 0.35],
    floor: [(LANE_MOUTH_X + end) / 2, 0, (near + far) / 2],
  }
}

export function lobbyPlants(count: number): PropPlacement[] {
  const benches = waitingBenches(count)
  const lastX = benches.length ? Math.max(...benches.map(b => b.position[0])) : FIRST_BENCH_X
  const priority = priorityBenches(count)
  const farX = priority.length ? Math.min(...priority.map(b => b.position[0])) : null
  const left: PropPlacement[] = [{ position: [laneEnd(count) - 0.5, 0, FACADE_Z - 0.75], scale: 1.1 }]
  if (farX !== null) left.push({ position: [farX - 1.1, 0, PLANT_Z], scale: 1.1 })
  return [
    { position: [FIRST_BENCH_X - 1.1, 0, PLANT_Z], scale: 1.1 },
    { position: [lastX + 1.1, 0, PLANT_Z], scale: 1.1 },
    { position: [DOOR_PLANT_X, 0, FACADE_Z - 0.7], scale: 1.25 },
    { position: [-DOOR_PLANT_X, 0, FACADE_Z - 0.7], scale: 1.25 },
    ...left,
  ]
}

export const lobbyBins = (): PropPlacement[] => [{ position: [FIRST_BENCH_X - 1.1, 0, BENCH_ROWS[1] + 0.2] }]

const railRect = (rail: Rail, pad: number): FloorRect => ({
  minX: Math.min(rail.from[0], rail.to[0]) - pad,
  maxX: Math.max(rail.from[0], rail.to[0]) + pad,
  minZ: Math.min(rail.from[1], rail.to[1]) - pad,
  maxZ: Math.max(rail.from[1], rail.to[1]) + pad,
})

function spanOf(placements: PropPlacement[], pad: number): FloorRect[] {
  if (!placements.length) return []
  const xs = placements.map(p => p.position[0])
  const zs = placements.map(p => p.position[2])
  return [{ minX: Math.min(...xs) - pad - 0.4, maxX: Math.max(...xs) + pad + 0.4, minZ: Math.min(...zs) - pad - 0.2, maxZ: Math.max(...zs) + pad + 0.2 }]
}

// What stands on the left half of the lobby floor: the priority lane, its sign, benches and plants.
export function priorityCorner(count: number): FloorRect[] {
  const lane = priorityLane(count)
  const plants = lobbyPlants(count).filter(plant => plant.position[0] < -2)
  return [
    ...lane.rails.map(rail => railRect(rail, OBSTACLE_PAD)),
    around(lane.sign, 0.4),
    ...spanOf(priorityBenches(count), OBSTACLE_PAD),
    ...plants.map(plant => around(plant.position, 0.45)),
  ]
}
