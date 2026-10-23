import { pickModel } from '@/domain/people'
import { SKELETON_MODEL_ID } from '@/shared/characters'
import type { QueuedPr, Snapshot } from '@/types/domain'
import type { Actor, LogicalAnim, Pose, SceneIndex, Vec3 } from '@/types/scene'
import { FACADE_Z, FACING_COUNTER, FACING_HALL, attendantSpot, copaSpot, isClosedIndex, sceneBounds, waitingSeat } from './layout'
import { lanePlace, queueLanes } from './queueLanes'

const STANDING_MAX_DAYS = 3
const SITTING_MAX_DAYS = 14
const SLEEPING_MAX_DAYS = 60

const POSE_ANIM: Record<Pose, LogicalAnim> = { standing: 'idle', sitting: 'sit', sleeping: 'sit', skeleton: 'idle' }

export function poseForAge(ageDays: number): Pose {
  if (ageDays < STANDING_MAX_DAYS) return 'standing'
  if (ageDays < SITTING_MAX_DAYS) return 'sitting'
  if (ageDays <= SLEEPING_MAX_DAYS) return 'sleeping'
  return 'skeleton'
}

export const animForPose = (pose: Pose) => POSE_ANIM[pose]
export const customerId = (repo: string, number: number) => `pr:${repo}#${number}`
export const personId = (login: string) => `person:${login}`

export function modelLookup(snapshot: Snapshot): (login: string) => string {
  const byLogin = new Map(snapshot.people.map(person => [person.login, person.modelId]))
  const pool = [...new Set(snapshot.people.map(person => person.modelId))]
  const ctoModel = byLogin.get(snapshot.meta.ctoLogin)
  const overrides = ctoModel ? { [snapshot.meta.ctoLogin]: ctoModel } : {}
  return login => byLogin.get(login) ?? pickModel(login, pool, overrides)
}

export function buildVisitor(id: string, login: string, modelId: string, position: Vec3, facing: number): Actor {
  return { id, kind: 'visitor', login, modelId, position, facing, pose: 'standing', anim: 'idle', dusty: false, pr: null, repo: null, outside: false }
}

function customerActor(pr: QueuedPr, position: Vec3, outside: boolean, modelFor: (login: string) => string, skeleton: string | null, facing = FACING_COUNTER): Actor {
  const pose = poseForAge(pr.ageDays)
  const bones = pose === 'skeleton'
  return {
    id: customerId(pr.repo, pr.number),
    kind: 'customer',
    login: pr.author,
    modelId: bones && skeleton ? skeleton : modelFor(pr.author),
    position,
    facing,
    pose,
    anim: animForPose(pose),
    dusty: bones && !skeleton,
    pr,
    repo: pr.repo,
    outside,
  }
}

function attendantActors(snapshot: Snapshot, modelFor: (login: string) => string, count: number): Actor[] {
  const counterIndex = new Map(snapshot.counters.slice(0, count).map((counter, i) => [counter.repo, i]))
  const seated = (repo: string | null) => (repo !== null && counterIndex.has(repo) ? repo : null)
  const seatsByRepo = new Map<string, string[]>()
  for (const person of snapshot.people) {
    const repo = seated(person.homeRepo)
    if (repo) seatsByRepo.set(repo, [...(seatsByRepo.get(repo) ?? []), person.login])
  }
  let copa = 0
  return snapshot.people.map(person => {
    const repo = seated(person.homeRepo)
    const seats = repo ? (seatsByRepo.get(repo) ?? []) : []
    const position = repo ? attendantSpot(counterIndex.get(repo) ?? 0, count, seats.indexOf(person.login), seats.length) : copaSpot(copa++, count)
    return { ...buildVisitor(personId(person.login), person.login, modelFor(person.login), position, FACING_HALL), kind: 'attendant', repo }
  })
}

const gatherDust = (actor: Actor): Actor => ({ ...actor, dusty: true })

// Counters past hallCount sit in the closed corridor: nobody attends them and their queue gathers dust.
export function buildActors(snapshot: Snapshot, skeletonModelId: string | null, hallCount = snapshot.counters.length): Actor[] {
  const count = hallCount
  const modelFor = modelLookup(snapshot)
  const closedCount = Math.max(0, snapshot.counters.length - count)
  const lanes = queueLanes(snapshot.counters.map(counter => counter.queue.length), count, closedCount)
  const maxX = sceneBounds(count, closedCount).maxX
  const customers = snapshot.counters.flatMap((counter, index) =>
    counter.queue.map((pr, slot) => {
      const place = lanePlace(lanes[index], slot)
      const [x, , z] = place.position
      const actor = customerActor(pr, place.position, z > FACADE_Z || x > maxX, modelFor, skeletonModelId, place.facing)
      return isClosedIndex(index, count) ? gatherDust(actor) : actor
    }),
  )
  const waiting = snapshot.waitingRoom.map((pr, seat): Actor => ({
    ...customerActor(pr, waitingSeat(seat, count), false, modelFor, null),
    kind: 'waiting',
    pose: 'sitting',
    anim: 'sit',
    dusty: false,
    facing: FACING_HALL,
  }))
  return [...customers, ...waiting, ...attendantActors(snapshot, modelFor, count)]
}

export function buildSceneIndex(snapshot: Snapshot, actors: Actor[], hallCount = snapshot.counters.length): SceneIndex {
  return {
    actors: new Map(actors.map(actor => [actor.id, actor])),
    counterIndex: new Map(snapshot.counters.map((counter, i) => [counter.repo, i])),
    queueLength: new Map(snapshot.counters.map(counter => [counter.repo, counter.queue.length])),
    queueHead: new Map(snapshot.counters.flatMap(counter => (counter.queue.length ? [[counter.repo, counter.queue[0].number] as const] : []))),
    counterCount: hallCount,
    modelFor: modelLookup(snapshot),
  }
}

export const sceneIndexFor = (snapshot: Snapshot, hallCount = snapshot.counters.length) =>
  buildSceneIndex(snapshot, buildActors(snapshot, SKELETON_MODEL_ID, hallCount), hallCount)
