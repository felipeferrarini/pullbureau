import type { IntroRoute, Vec3 } from '@/types/scene'
import { distance } from '../motion'
import { introDuration } from '../intro'
import type { CameraGoal } from '../layout'

export const DOOR_OPEN_S = 2.6
export const WALK_START_S = 3.2
export const INTRO_WALK_SPEED = 2.4
export const DELAY_SCALE = 0.5
const SETTLE_S = 0.6
const OVERVIEW_ARRIVAL_S = 18.5

export type IntroPose = { position: Vec3; moving: boolean; heading: number | null }

export const scheduleRoutes = (routes: IntroRoute[]): IntroRoute[] =>
  routes.map(route => ({ ...route, delay: WALK_START_S + route.delay * DELAY_SCALE }))

export const introTotal = (scheduled: IntroRoute[]) => Math.max(OVERVIEW_ARRIVAL_S, introDuration(scheduled, INTRO_WALK_SPEED)) + SETTLE_S

const headingOf = (from: Vec3, to: Vec3) => Math.atan2(to[0] - from[0], to[2] - from[2])

export function introPosition(route: IntroRoute, elapsed: number, speed = INTRO_WALK_SPEED): IntroPose {
  const points = route.waypoints
  const first = points.length > 1 ? headingOf(points[0], points[1]) : null
  let travelled = Math.max(0, elapsed - route.delay) * speed
  if (travelled === 0) return { position: points[0], moving: false, heading: first }
  for (let i = 1; i < points.length; i++) {
    const leg = distance(points[i - 1], points[i])
    if (travelled <= leg && leg > 0) {
      const k = travelled / leg
      const [a, b] = [points[i - 1], points[i]]
      return { position: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k], moving: true, heading: headingOf(a, b) }
    }
    travelled -= leg
  }
  return { position: points[points.length - 1], moving: false, heading: null }
}

type CameraKey = { t: number; position: Vec3; target: Vec3 }

const CAMERA_KEYS: CameraKey[] = [
  { t: 0, position: [0, 1.7, 27], target: [0, 3.4, 7] },
  { t: WALK_START_S, position: [0, 1.75, 23], target: [0, 3, 7] },
  { t: 9.5, position: [1.1, 2.65, 12], target: [0.3, 1.7, 2] },
  { t: 13, position: [1.1, 3.5, 4.2], target: [0.3, 1, -4] },
]

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

const spline = (points: Vec3[], i: number, t: number): Vec3 => {
  const at = (k: number) => points[Math.min(points.length - 1, Math.max(0, k))]
  return [0, 1, 2].map(axis => catmullRom(at(i - 1)[axis], at(i)[axis], at(i + 1)[axis], at(i + 2)[axis], t)) as Vec3
}

// Street establishing shot, dolly through the door, then up and back to the overview.
export function introCamera(elapsed: number, overview: CameraGoal): CameraGoal {
  const keys = [...CAMERA_KEYS, { t: OVERVIEW_ARRIVAL_S, ...overview }]
  const t = Math.min(Math.max(0, elapsed), OVERVIEW_ARRIVAL_S)
  const i = Math.max(0, keys.findIndex((key, k) => k === keys.length - 1 || t < keys[k + 1].t))
  const segment = Math.min(i, keys.length - 2)
  const local = (t - keys[segment].t) / (keys[segment + 1].t - keys[segment].t)
  const eased = segment === keys.length - 2 ? 1 - (1 - local) ** 2 : local
  return {
    position: spline(keys.map(key => key.position), segment, eased),
    target: spline(keys.map(key => key.target), segment, eased),
  }
}

export const INTRO_CAMERA_END_S = OVERVIEW_ARRIVAL_S
