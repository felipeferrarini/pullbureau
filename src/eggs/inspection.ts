import { t } from '@/i18n'
import { buildVisitor } from '@/scene/actors'
import { travelMs } from '@/scene/director/plan'
import { FACING_COUNTER, MAX_INSIDE, doorSpot, serviceSpot } from '@/scene/layout'
import { queueSlot } from '@/scene/queueLanes'
import { RUN_SPEED } from '@/scene/motion'
import type { Snapshot } from '@/types/domain'
import type { Actor, Effect, Override, Plan, SceneIndex, Vec3 } from '@/types/scene'
import { HELI_EXIT, heliTiming } from './helicopter'

export const INSPECTION_EVERY_MS = 5 * 60_000
export const INSPECTION_RETRY_MS = 5000
export const FORCED_INSPECTION_DELAY_MS = 3000
export const HELI_NOTICE = t('inspection.notice')

const BESIDE_QUEUE = 1.1
const LOOK_MS = 1500
const TALK_MS = 6000
const SWEAT_MS = 1500
const PANIC_AT = 300
const WAKE_AT = 800
const LOOKING_AT_QUEUE = -Math.PI / 2
const PANIC_LINE = t('inspection.panic')
const INSPECTOR_PREFIX = 'egg:inspection:'

export const isInspector = (actorId: string) => actorId.startsWith(INSPECTOR_PREFIX)

const beside = (spot: Vec3): Vec3 => [spot[0] + BESIDE_QUEUE, spot[1], spot[2]]

type InspectionGate = { introOver: boolean; duel: boolean; inspectingUntil: number; now: number }

export const inspectionBlocked = ({ introOver, duel, inspectingUntil, now }: InspectionGate) => !introOver || duel || now < inspectingUntil

export const inspectionLine = (count: number) => (count > 0 ? t('inspection.count', { count }) : t('inspection.clear'))

function panic(index: SceneIndex, ctoLogin: string): Override[] {
  if (!index.counterCount) return []
  const idle = [...index.actors.values()].filter(actor => actor.kind === 'attendant' && actor.repo === null && actor.login !== ctoLogin)
  return idle.map((actor, i) => {
    const [x, y, z] = serviceSpot(i % index.counterCount, index.counterCount)
    return { actorId: actor.id, at: PANIC_AT, target: [x + Math.floor(i / index.counterCount) * 0.6, y, z], run: true }
  })
}

function alarmCall(panicking: Override[]): Effect[] {
  const first = panicking[0]
  return first ? [{ kind: 'bubble', actorId: first.actorId, text: PANIC_LINE, at: first.at, duration: 2200 }] : []
}

const sitters = (index: SceneIndex) => [...index.actors.values()].filter(actor => actor.kind === 'customer' && (actor.pose === 'sleeping' || actor.pose === 'sitting'))

function wake(index: SceneIndex): Override[] {
  return sitters(index).map(actor => ({ actorId: actor.id, at: WAKE_AT, anim: 'idle' as const }))
}

// Once he is back in the helicopter the hall breathes again: sitters sit, the copa crowd walks back.
function relax(index: SceneIndex, panicking: Override[], at: number): Override[] {
  const copa = panicking.flatMap(({ actorId }) => {
    const actor = index.actors.get(actorId)
    return actor ? [{ actorId, at, target: actor.position, facing: actor.facing }] : []
  })
  return [...sitters(index).map(actor => ({ actorId: actor.id, at, anim: 'sit' as const })), ...copa]
}

type Walk = { overrides: Override[]; effects: Effect[]; back: number }

const shifted = <T extends { at: number }>(items: T[], by: number): T[] => items.map(item => ({ ...item, at: item.at + by }))

// On foot, from the helicopter door into the hall, along the queue with most of his PRs, and back out.
function walkIn(snapshot: Snapshot, index: SceneIndex, cto: Actor, ctoLogin: string): Walk {
  const count = index.counterCount
  const mine = snapshot.counters.map(counter => counter.queue.filter(pr => pr.author === ctoLogin).length)
  const total = mine.reduce((sum, n) => sum + n, 0)
  const target = Math.max(0, mine.indexOf(Math.max(0, ...mine)))
  const visible = Math.min(snapshot.counters[target]?.queue.length ?? 0, MAX_INSIDE)

  const door = doorSpot()
  const tail = beside(queueSlot(target, count, Math.max(0, visible - 1)))
  const head = beside(queueSlot(target, count, 0))
  const hurry = total > 0

  const reachDoor = travelMs(HELI_EXIT, door)
  const reachTail = reachDoor + travelMs(door, tail)
  const reachHead = reachTail + travelMs(tail, head)
  const talkAt = reachHead + LOOK_MS
  const leaveAt = talkAt + TALK_MS + (hurry ? SWEAT_MS : 0)
  const outAt = leaveAt + travelMs(head, door, RUN_SPEED)
  const back = outAt + travelMs(door, HELI_EXIT, RUN_SPEED) + 400

  const effects: Effect[] = [{ kind: 'bubble', actorId: cto.id, text: inspectionLine(total), at: talkAt, duration: TALK_MS }]
  if (hurry) effects.push({ kind: 'bubble', actorId: cto.id, text: '💧', at: talkAt + TALK_MS, duration: SWEAT_MS })
  const overrides: Override[] = [
    { actorId: cto.id, at: 0, target: door },
    { actorId: cto.id, at: reachDoor, target: tail },
    { actorId: cto.id, at: reachTail, target: head },
    { actorId: cto.id, at: reachHead, target: head, anim: 'idle', facing: LOOKING_AT_QUEUE },
    { actorId: cto.id, at: leaveAt, target: door, run: hurry },
    { actorId: cto.id, at: outAt, target: HELI_EXIT, run: hurry },
  ]
  return { overrides, effects, back }
}

export function planInspection(snapshot: Snapshot, index: SceneIndex, ctoLogin: string, stamp = snapshot.generatedAt): Plan {
  const cto = buildVisitor(`${INSPECTOR_PREFIX}${stamp}`, ctoLogin, index.modelFor(ctoLogin), HELI_EXIT, FACING_COUNTER)
  const walk = walkIn(snapshot, index, cto, ctoLogin)
  const timing = heliTiming(walk.back)
  const panicking = shifted(panic(index, ctoLogin), timing.touchdown)

  return {
    id: cto.id,
    repo: null,
    duration: timing.gone,
    overrides: [...shifted(walk.overrides, timing.exit), ...panicking, ...shifted(wake(index), timing.touchdown), ...relax(index, panicking, timing.board)],
    effects: [
      { kind: 'helicopter', timing, at: 0, duration: timing.gone },
      { kind: 'sound', sound: 'tension', at: timing.touchdown, duration: 0 },
      ...alarmCall(panicking),
      ...shifted(walk.effects, timing.exit),
    ],
    spawns: [{ actor: cto, from: timing.exit, until: timing.board }],
  }
}
