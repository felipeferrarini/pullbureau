import type { ReviewState, SceneEvent } from '@/types/domain'
import type { ActiveEffect, ActiveOverride, BubbleView, Effect, Override, Plan, SceneIndex, SoundName, Spawn, StampVariant, StartedPlan, Vec3 } from '@/types/scene'
import { buildVisitor, customerId, personId } from '../actors'
import { COUNTER_Z, FACING_COUNTER, FACING_HALL, LANE_HALF_WIDTH, MAX_INSIDE, QUEUE_SPACING, QUEUE_START_Z, backDoorSpot, counterX, doorSpot, serviceSpot, totemSpot } from '../layout'
import { TURN_ROWS, backOfLine, queueSlot } from '../queueLanes'
import { RUN_SPEED, WALK_SPEED, distance } from '../motion'

export const MAX_TRAVEL_MS = 8000
export const BUBBLE_MS = 3500
export const STAMP_MS = 2500
export const LAMP_MS = 4000
export const MAX_CONCURRENT_PLANS = 3
export const MAX_BUBBLES = 4

const BESIDE_QUEUE = 0.8
const STAMP_FOR: Record<ReviewState, StampVariant> = { approved: 'approved', changes_requested: 'rejected', commented: 'review' }

type Context = { id: string; repo: string; number: number; author: string; counter: number; index: SceneIndex }

export const travelMs = (from: Vec3, to: Vec3, speed = WALK_SPEED) => Math.min(MAX_TRAVEL_MS, Math.round((distance(from, to) / speed) * 1000))
const offset = (p: Vec3, dx = 0, dy = 0, dz = 0): Vec3 => [p[0] + dx, p[1] + dy, p[2] + dz]
const sound = (name: SoundName, at: number): Effect => ({ kind: 'sound', sound: name, at, duration: 0 })
const untilEnd = (spawns: Spawn[], duration: number) => spawns.map(spawn => ({ ...spawn, until: duration }))
const stampSpot = (ctx: Context): Vec3 => {
  const [x] = serviceSpot(ctx.counter, ctx.index.counterCount)
  return [x, 1.3, COUNTER_Z + 0.5]
}

function presence(ctx: Context, login: string, preferCustomer: boolean, fallback: Vec3) {
  const customer = preferCustomer && login === ctx.author ? ctx.index.actors.get(customerId(ctx.repo, ctx.number)) : undefined
  const known = customer ?? ctx.index.actors.get(personId(login))
  if (known) return { actorId: known.id, start: known.position, spawns: [] as Spawn[] }
  const visitor = buildVisitor(`visitor:${ctx.id}:${login}`, login, ctx.index.modelFor(login), fallback, FACING_HALL)
  return { actorId: visitor.id, start: fallback, spawns: [{ actor: visitor, from: 0, until: 0 }] }
}

function planOpened(ctx: Context): Plan | null {
  const actorId = customerId(ctx.repo, ctx.number)
  if (!ctx.index.actors.has(actorId)) return null
  const door = doorSpot()
  const totem = totemSpot()
  const arrive = travelMs(door, totem)
  return {
    id: ctx.id,
    repo: ctx.repo,
    duration: arrive + 2500,
    overrides: [{ actorId, at: 0, from: door, target: totem }],
    effects: [sound('ding', arrive), { kind: 'bubble', actorId, text: `Senha ${ctx.number}`, at: arrive, duration: 2000 }],
    spawns: [],
  }
}

function queueLengths(index: SceneIndex): number[] {
  const lengths: number[] = []
  for (const [repo, at] of index.counterIndex) lengths[at] = index.queueLength.get(repo) ?? 0
  return Array.from(lengths, length => length ?? 0)
}

function planReview(ctx: Context, reviewer: string, state: ReviewState): Plan {
  const service = serviceSpot(ctx.counter, ctx.index.counterCount)
  const who = presence(ctx, reviewer, false, backDoorSpot(ctx.index.counterCount))
  const arrive = travelMs(who.start, service)
  const stampAt = arrive + 300
  const overrides: Override[] = [{ actorId: who.actorId, at: 0, target: service, anim: 'interact', facing: FACING_HALL }]
  const effects: Effect[] = []
  let duration = stampAt + STAMP_MS

  effects.push({ kind: 'stamp', position: stampSpot(ctx), variant: STAMP_FOR[state], at: stampAt, duration: STAMP_MS }, sound('stamp', stampAt))
  if (state !== 'commented') {
    const customer = ctx.index.actors.get(customerId(ctx.repo, ctx.number))
    if (state === 'changes_requested' && customer) {
      const closed = Math.max(0, ctx.index.counterIndex.size - ctx.index.counterCount)
      const place = backOfLine(ctx.counter, ctx.index.counterCount, queueLengths(ctx.index), closed)
      const back = place.position
      overrides.push({ actorId: customer.id, at: stampAt, target: back, anim: 'no', facing: place.facing })
      effects.push({ kind: 'bubble', actorId: customer.id, text: '😞', at: stampAt, duration: 2000 })
      duration = Math.max(duration, stampAt + travelMs(customer.position, back) + 1500)
    }
  }
  return { id: ctx.id, repo: ctx.repo, duration, overrides, effects, spawns: untilEnd(who.spawns, duration) }
}

function planComment(ctx: Context, author: string, excerpt: string, replyTo: string | null): Plan {
  const who = presence(ctx, author, true, offset(serviceSpot(ctx.counter, ctx.index.counterCount), 1.2, 0, 0.8))
  return {
    id: ctx.id,
    repo: ctx.repo,
    duration: BUBBLE_MS,
    overrides: [],
    effects: [{ kind: 'bubble', actorId: who.actorId, text: excerpt, replyTo, at: 0, duration: BUBBLE_MS }],
    spawns: untilEnd(who.spawns, BUBBLE_MS),
  }
}

function planCi(ctx: Context, result: 'success' | 'failure'): Plan {
  const actorId = customerId(ctx.repo, ctx.number)
  const ok = result === 'success'
  return {
    id: ctx.id,
    repo: ctx.repo,
    duration: LAMP_MS,
    overrides: ctx.index.actors.has(actorId) ? [{ actorId, at: 0, anim: ok ? 'yes' : 'no' }] : [],
    effects: [{ kind: 'lamp', repo: ctx.repo, color: ok ? 'green' : 'red', at: 0, duration: LAMP_MS }, sound(ok ? 'ding' : 'buzz', 0)],
    spawns: [],
  }
}

function leavingVisitor(ctx: Context) {
  const spot = offset(queueSlot(ctx.counter, ctx.index.counterCount, 0), BESIDE_QUEUE)
  return buildVisitor(`leaving:${ctx.id}`, ctx.author, ctx.index.modelFor(ctx.author), spot, FACING_HALL)
}

function planMerged(ctx: Context): Plan {
  const visitor = leavingVisitor(ctx)
  const exit = backDoorSpot(ctx.index.counterCount)
  const leaveAt = 2500
  const duration = leaveAt + travelMs(visitor.position, exit)
  return {
    id: ctx.id,
    repo: ctx.repo,
    duration,
    overrides: [{ actorId: visitor.id, at: 0, anim: 'victory' }, { actorId: visitor.id, at: leaveAt, target: exit }],
    effects: [
      { kind: 'confetti', position: offset(visitor.position, 0, 2), at: 0, duration: 3000 },
      { kind: 'stamp', position: stampSpot(ctx), variant: 'approved', at: 0, duration: STAMP_MS },
      sound('fanfare', 0),
    ],
    spawns: [{ actor: visitor, from: 0, until: duration }],
  }
}

const JUMP_RAIL_GAP = 0.32
const JUMP_RUNUP = 1.8
const JUMP_CLEAR = 0.4
const CUT_IN = 0.75
const JUMP_STAMP_MS = 500
const JUMP_GLOAT_MS = 1900

function jumpLane(ctx: Context) {
  const length = Math.min(ctx.index.queueLength.get(ctx.repo) ?? 0, MAX_INSIDE)
  const x = counterX(ctx.counter, ctx.index.counterCount) + LANE_HALF_WIDTH + JUMP_RAIL_GAP
  const tail = QUEUE_START_Z + (Math.max(1, length) - 1) * QUEUE_SPACING
  return { start: [x, 0, Math.min(tail + JUMP_RUNUP, TURN_ROWS.first - JUMP_CLEAR)] as Vec3, head: [x, 0, QUEUE_START_Z - 0.4] as Vec3 }
}

function protest(ctx: Context, at: number): { overrides: Override[]; effects: Effect[] } {
  const head = ctx.index.actors.get(customerId(ctx.repo, ctx.index.queueHead.get(ctx.repo) ?? -1))
  if (!head) return { overrides: [], effects: [] }
  return {
    overrides: [{ actorId: head.id, at, anim: 'no' }],
    effects: [{ kind: 'bubble', actorId: head.id, text: 'Ei! Tem fila aqui!', at, duration: 2200 }],
  }
}

// Merged with no review: the author rolls past the whole line, cuts in at the counter and leaves stamped.
function planQueueJump(ctx: Context): Plan {
  const lane = jumpLane(ctx)
  const jumper = buildVisitor(`jumper:${ctx.id}`, ctx.author, ctx.index.modelFor(ctx.author), lane.start, FACING_COUNTER)
  const front: Vec3 = [counterX(ctx.counter, ctx.index.counterCount), 0, COUNTER_Z + CUT_IN]
  const rollAt = 300
  const rolled = rollAt + travelMs(lane.start, lane.head, RUN_SPEED)
  const cutIn = rolled + travelMs(lane.head, front)
  const stampAt = cutIn + JUMP_STAMP_MS
  const leaveAt = stampAt + JUMP_GLOAT_MS
  const exit = backDoorSpot(ctx.index.counterCount)
  const duration = leaveAt + travelMs(front, exit)
  const outrage = protest(ctx, rolled)
  return {
    id: ctx.id,
    repo: ctx.repo,
    duration,
    overrides: [
      { actorId: jumper.id, at: rollAt, target: lane.head, run: true, moveAnim: 'roll' },
      { actorId: jumper.id, at: rolled, target: front, facing: FACING_COUNTER },
      { actorId: jumper.id, at: stampAt, target: front, anim: 'victory', facing: FACING_HALL },
      { actorId: jumper.id, at: leaveAt, target: exit },
      ...outrage.overrides,
    ],
    effects: [
      sound('siren', 0),
      { kind: 'jumpSign', actorId: jumper.id, at: 0, duration: leaveAt },
      { kind: 'stamp', position: stampSpot(ctx), variant: 'approved', at: stampAt, duration: STAMP_MS },
      sound('stamp', stampAt),
      ...outrage.effects,
    ],
    spawns: [{ actor: jumper, from: 0, until: duration }],
  }
}

function planClosed(ctx: Context): Plan {
  const visitor = leavingVisitor(ctx)
  const duration = 2600
  return {
    id: ctx.id,
    repo: ctx.repo,
    duration,
    overrides: [{ actorId: visitor.id, at: 0, anim: 'no' }, { actorId: visitor.id, at: 800, target: offset(visitor.position, 0, -3), run: true, moveAnim: 'jump' }],
    effects: [{ kind: 'trapdoor', position: visitor.position, at: 300, duration: 2200 }, sound('whoosh', 800)],
    spawns: [{ actor: visitor, from: 0, until: duration }],
  }
}

export function planEvent(event: SceneEvent, index: SceneIndex): Plan | null {
  const counter = index.counterIndex.get(event.pr.repo)
  if (counter === undefined) return null
  const ctx: Context = { id: `${event.kind}:${event.pr.repo}#${event.pr.number}:${event.at}`, repo: event.pr.repo, number: event.pr.number, author: event.pr.author, counter, index }
  switch (event.kind) {
    case 'pr_opened':
      return planOpened(ctx)
    case 'review':
      return planReview(ctx, event.reviewer, event.state)
    case 'comment':
      return planComment(ctx, event.author, event.excerpt, event.replyTo)
    case 'ci':
      return planCi(ctx, event.result)
    case 'merged':
      return event.queueJump ? planQueueJump(ctx) : planMerged(ctx)
    case 'closed':
      return planClosed(ctx)
  }
}

const elapsedIn = (plan: StartedPlan, now: number) => now - plan.startedAt
const running = (plan: StartedPlan, now: number) => elapsedIn(plan, now) >= 0 && elapsedIn(plan, now) < plan.duration

export function activeOverride(plans: StartedPlan[], actorId: string, now: number): ActiveOverride | null {
  let found: ActiveOverride | null = null
  for (const plan of plans) {
    if (!running(plan, now)) continue
    plan.overrides.forEach((override, i) => {
      if (override.actorId === actorId && override.at <= elapsedIn(plan, now)) found = { ...override, key: `${plan.id}:${i}` }
    })
  }
  return found
}

export function activeEffects(plans: StartedPlan[], now: number): ActiveEffect[] {
  return plans.flatMap(plan =>
    plan.effects.flatMap((effect, i) => {
      const elapsed = elapsedIn(plan, now)
      return effect.duration > 0 && elapsed >= effect.at && elapsed < effect.at + effect.duration ? [{ ...effect, key: `${plan.id}:e${i}`, elapsed: elapsed - effect.at }] : []
    }),
  )
}

export function activeSpawns(plans: StartedPlan[], now: number): Spawn[] {
  return plans.flatMap(plan => plan.spawns.filter(spawn => elapsedIn(plan, now) >= spawn.from && elapsedIn(plan, now) < spawn.until))
}

export function activeBubbles(plans: StartedPlan[], now: number, limit = MAX_BUBBLES): Map<string, BubbleView> {
  const live = plans.flatMap(plan =>
    plan.effects.flatMap((effect, i) => {
      const elapsed = elapsedIn(plan, now)
      if (effect.kind !== 'bubble' || elapsed < effect.at || elapsed >= effect.at + effect.duration) return []
      return [{ actorId: effect.actorId, view: { key: `${plan.id}:e${i}`, text: effect.text, replyTo: effect.replyTo ?? null, startedAt: plan.startedAt + effect.at } }]
    }),
  )
  const newest = live.sort((a, b) => b.view.startedAt - a.view.startedAt)
  const bubbles = new Map<string, BubbleView>()
  for (const { actorId, view } of newest) {
    if (bubbles.size >= limit) break
    if (!bubbles.has(actorId)) bubbles.set(actorId, view)
  }
  return bubbles
}

export function lampFor(effects: ActiveEffect[], repo: string): 'red' | 'green' | null {
  const lamp = effects.findLast(effect => effect.kind === 'lamp' && effect.repo === repo)
  return lamp?.kind === 'lamp' ? lamp.color : null
}

export function dueSounds(plans: StartedPlan[], now: number, fired: Set<string>): { key: string; sound: SoundName }[] {
  return plans.flatMap(plan =>
    plan.effects.flatMap((effect, i) => {
      const key = `${plan.id}:s${i}`
      return effect.kind === 'sound' && effect.at <= elapsedIn(plan, now) && !fired.has(key) ? [{ key, sound: effect.sound }] : []
    }),
  )
}

export function canStartEvent(plans: StartedPlan[], event: SceneEvent): boolean {
  const eventPlans = plans.filter(plan => plan.repo !== null)
  return eventPlans.length < MAX_CONCURRENT_PLANS && !eventPlans.some(plan => plan.repo === event.pr.repo)
}

export const pruneFinished = (plans: StartedPlan[], now: number) => plans.filter(plan => elapsedIn(plan, now) < plan.duration)

export const MAX_DIRECTOR_STEP_MS = 1000

export type DirectorTime = { real: number; virtual: number }

// Plan time advances at most a second per tick, so a stalled tab slows the show down instead of skipping it.
export function advanceDirector(time: DirectorTime, real: number, maxStep = MAX_DIRECTOR_STEP_MS): DirectorTime {
  return { real, virtual: time.virtual + Math.min(maxStep, Math.max(0, real - time.real)) }
}
