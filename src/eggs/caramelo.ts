import { priorityCorner } from '@/scene/hall/lobbyLayout'
import { FACADE_Z, hallWidth, totemSpot } from '@/scene/layout'
import type { DogActivity, DogClicks, DogZone } from '@/types/eggs'
import type { FloorPoint, FloorRect, Vec3 } from '@/types/scene'

export const LOVE_CLICKS = 5
export const LOVE_WINDOW_MS = 8000
export const FOLLOW_MS = 4000

const WALL_PAD = 1.5
const FRONT_Z = -0.1
const BACK_Z = FACADE_Z - 1.4
const STEP = 0.25
const MIN_HOP = 1.5
const TRIES = 16
const BENCH_FROM_X = 4.6
const BENCH_ZONE: [number, number] = [3.4, 6.1]
const BENCH_WALL_CLEARANCE = 5

const around = ([x, , z]: Vec3, pad: number): FloorRect => ({ minX: x - pad, maxX: x + pad, minZ: z - pad, maxZ: z + pad })

const LINE_PAD = 0.5

// The floor a queue stands on, one box per straight stretch.
function lineRects(line: FloorPoint[]): FloorRect[] {
  return line.slice(1).map((to, i) => {
    const from = line[i]
    return {
      minX: Math.min(from[0], to[0]) - LINE_PAD,
      maxX: Math.max(from[0], to[0]) + LINE_PAD,
      minZ: Math.min(from[1], to[1]) - LINE_PAD,
      maxZ: Math.max(from[1], to[1]) + LINE_PAD,
    }
  })
}

// The open floor between the queues and the front wall, minus the benches, the priority corner, the totem
// and every line that winds across it to the door.
export function dogZone(hallCount: number, lines: FloorPoint[][] = []): DogZone {
  const half = hallWidth(hallCount) / 2
  return {
    minX: -half + WALL_PAD,
    maxX: half - WALL_PAD,
    minZ: FRONT_Z,
    maxZ: BACK_Z,
    blocked: [
      { minX: BENCH_FROM_X, maxX: half - BENCH_WALL_CLEARANCE, minZ: BENCH_ZONE[0], maxZ: BENCH_ZONE[1] },
      around(totemSpot(), 0.7),
      ...priorityCorner(hallCount),
      ...lines.flatMap(lineRects),
    ],
  }
}

const inside = (rect: FloorRect, x: number, z: number) => x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ

export const isFree = (zone: DogZone, x: number, z: number) => inside(zone, x, z) && !zone.blocked.some(rect => inside(rect, x, z))

export function pathClear(zone: DogZone, from: Vec3, to: Vec3): boolean {
  const length = Math.hypot(to[0] - from[0], to[2] - from[2])
  const steps = Math.max(1, Math.ceil(length / STEP))
  for (let i = 1; i <= steps; i++) {
    const k = i / steps
    if (!isFree(zone, from[0] + (to[0] - from[0]) * k, from[2] + (to[2] - from[2]) * k)) return false
  }
  return true
}

export function wanderTarget(zone: DogZone, from: Vec3, random: () => number = Math.random): Vec3 {
  for (let i = 0; i < TRIES; i++) {
    const candidate: Vec3 = [zone.minX + random() * (zone.maxX - zone.minX), 0, zone.minZ + random() * (zone.maxZ - zone.minZ)]
    const far = Math.hypot(candidate[0] - from[0], candidate[2] - from[2]) >= MIN_HOP
    if (far && isFree(zone, candidate[0], candidate[2]) && pathClear(zone, from, candidate)) return candidate
  }
  return from
}

// By the entrance, left of the door, like any shop dog.
export const DOG_BED: Vec3 = [-3, 0, FACADE_Z - 1.5]

export function nextActivity(random: () => number, canVisit: boolean): DogActivity {
  const roll = random()
  if (roll < 0.22) return canVisit ? 'visit' : 'wander'
  if (roll < 0.32) return 'nap'
  return roll < 0.52 ? 'sit' : 'wander'
}

// Where the dog lies down: at the feet of the oldest PR, on the hall side.
export const restSpot = ([x, , z]: Vec3): Vec3 => [x + 0.55, 0, z + 0.45]

export function registerClick(clicks: number[], now: number): DogClicks {
  const recent = [...clicks.filter(at => now - at < LOVE_WINDOW_MS), now]
  return recent.length >= LOVE_CLICKS ? { clicks: [], love: true } : { clicks: recent, love: false }
}
