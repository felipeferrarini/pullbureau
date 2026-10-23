import type { Rect } from '@/types/outside'
import type { ActorKind, IntroActor, IntroRoute, SearchParamsLike, Vec3 } from '@/types/scene'
import { DOOR, SIDEWALK } from './layout'
import { WALK_SPEED, distance } from './motion'
import { DEFAULT_FOOTPRINT, indoors, walkRoute } from './walkRoute'

export const INTRO_SPREAD_S = 20
const MAX_STEP_S = 1.2
const GROUP_GAP_STEPS = 1.5
const JITTER = 0.3
const CROWD_SIZE = 4
const CROWD_RADIUS = 1.2
const SIDEWALK_MARGIN = 1

const KIND_ORDER: Record<ActorKind, number> = { attendant: 0, customer: 1, waiting: 2, visitor: 3 }

type Placed = IntroActor & { target: Vec3 }

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (value: number) => Math.round(value * 1000) / 1000
const groupOf = (actor: IntroActor) => (actor.kind === 'customer' ? `customer:${actor.repo}` : actor.kind)

function orderedActors(actors: IntroActor[], targets: Map<string, Vec3>): Placed[] {
  return actors
    .flatMap(actor => {
      const target = targets.get(actor.id)
      return target ? [{ ...actor, target }] : []
    })
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
}

function departureSteps(actors: Placed[]): number[] {
  let step = 0
  return actors.map((actor, i) => {
    if (i > 0) step += groupOf(actor) === groupOf(actors[i - 1]) ? 1 : GROUP_GAP_STEPS
    return step
  })
}

function crowdCenters(count: number, halfWidth: number, random: () => number): Vec3[] {
  return Array.from({ length: count }, () => [
    (random() * 2 - 1) * (halfWidth - SIDEWALK_MARGIN),
    0,
    SIDEWALK.near + CROWD_RADIUS + random() * (SIDEWALK.far - SIDEWALK.near - 2 * CROWD_RADIUS),
  ])
}

function aroundCenter(center: Vec3, random: () => number): Vec3 {
  const angle = random() * 2 * Math.PI
  const radius = random() * CROWD_RADIUS
  return [round(center[0] + Math.cos(angle) * radius), 0, round(center[2] + Math.sin(angle) * radius)]
}

// Everyone going in files through the middle of the door; places outside are reached round the building.
function waypointsFor(start: Vec3, target: Vec3, footprint: Rect): Vec3[] {
  if (indoors(target, footprint)) return [start, DOOR.outside, DOOR.inside, target]
  return [start, ...walkRoute(start, target, footprint)]
}

export function introPlan(actors: IntroActor[], targets: Map<string, Vec3>, seed: number, footprint: Rect = DEFAULT_FOOTPRINT): IntroRoute[] {
  const placed = orderedActors(actors, targets)
  const random = seededRandom(seed)
  const halfWidth = Math.max(SIDEWALK.minHalfWidth, ...placed.map(actor => Math.abs(actor.target[0])))
  const centers = crowdCenters(Math.ceil(placed.length / CROWD_SIZE), halfWidth, random)
  const steps = departureSteps(placed)
  const stepS = Math.min(MAX_STEP_S, INTRO_SPREAD_S / Math.max(1, (steps.at(-1) ?? 0) + JITTER))
  return placed.map((actor, i) => {
    const start = aroundCenter(centers[Math.floor(i / CROWD_SIZE)], random)
    const jitter = i === 0 ? 0 : random() * JITTER
    return { actorId: actor.id, start, waypoints: waypointsFor(start, actor.target, footprint), delay: round((steps[i] + jitter) * stepS) }
  })
}

const pathLength = (points: Vec3[]) => points.slice(1).reduce((sum, point, i) => sum + distance(points[i], point), 0)

export function introDuration(routes: IntroRoute[], speed = WALK_SPEED): number {
  return routes.reduce((max, route) => Math.max(max, route.delay + pathLength(route.waypoints) / speed), 0)
}

export function shouldPlayIntro({ isFirstSnapshot, params }: { isFirstSnapshot: boolean; params: SearchParamsLike }): boolean {
  return isFirstSnapshot && params.get('intro') !== '0'
}
