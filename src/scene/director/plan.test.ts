import { describe, expect, it } from 'vitest'
import { counter, person, queuedPr, snapshot } from '@/domain/testFactories'
import type { SceneEvent } from '@/types/domain'
import type { Plan, StartedPlan } from '@/types/scene'
import { buildActors, buildSceneIndex, customerId, personId } from '../actors'
import { doorSpot, serviceSpot, totemSpot } from '../layout'
import { MAX_BUBBLES, MAX_CONCURRENT_PLANS, advanceDirector, activeBubbles, activeEffects, activeOverride, activeSpawns, canStartEvent, dueSounds, planEvent } from './plan'

const pr = { repo: 'api', number: 1, title: 't', url: 'u', author: 'example-user' }
const snap = snapshot({
  counters: [counter({ repo: 'api', queue: [queuedPr({ number: 1 }), queuedPr({ number: 2 })], attendants: [] })],
  people: [person('example-user'), person('henry', 'api')],
})
const index = buildSceneIndex(snap, buildActors(snap, null))
const start = (plan: Plan | null, startedAt = 0): StartedPlan => ({ ...(plan as Plan), startedAt })

describe('planEvent', () => {
  it('walks a new PR from the door to the totem and rings the bell', () => {
    const plan = planEvent({ kind: 'pr_opened', at: 'a', pr }, index)!
    expect(plan.overrides[0]).toMatchObject({ actorId: customerId('api', 1), from: doorSpot(), target: totemSpot() })
    expect(plan.effects.some(e => e.kind === 'sound' && e.sound === 'ding')).toBe(true)
  })

  it('sends the reviewer to the counter and stamps an approval', () => {
    const plan = planEvent({ kind: 'review', at: 'a', pr, reviewer: 'henry', state: 'approved' }, index)!
    expect(plan.overrides[0]).toMatchObject({ actorId: personId('henry'), target: serviceSpot(0, 1) })
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'stamp', variant: 'approved' }))
  })

  it('sends the author to the back of the line on changes requested', () => {
    const plan = planEvent({ kind: 'review', at: 'a', pr, reviewer: 'henry', state: 'changes_requested' }, index)!
    expect(plan.overrides).toContainEqual(expect.objectContaining({ actorId: customerId('api', 1), anim: 'no' }))
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'stamp', variant: 'rejected' }))
  })

  it('stamps a review comment as under analysis', () => {
    const plan = planEvent({ kind: 'review', at: 'a', pr, reviewer: 'henry', state: 'commented' }, index)!
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'stamp', variant: 'review' }))
    expect(plan.effects.some(e => e.kind === 'sound' && e.sound === 'stamp')).toBe(true)
    expect(plan.effects.some(e => e.kind === 'bubble')).toBe(false)
  })

  it('spawns a visitor for reviewers that are not in the hall', () => {
    const plan = planEvent({ kind: 'review', at: 'a', pr, reviewer: 'outsider', state: 'commented' }, index)!
    expect(plan.spawns).toHaveLength(1)
    expect(plan.spawns[0].until).toBe(plan.duration)
  })

  it('lets the PR author speak from the queue', () => {
    const plan = planEvent({ kind: 'comment', at: 'a', pr, author: 'example-user', replyTo: null, excerpt: 'oi' }, index)!
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'bubble', actorId: customerId('api', 1), text: 'oi', replyTo: null }))
  })

  it('remembers who a comment replies to', () => {
    const plan = planEvent({ kind: 'comment', at: 'a', pr, author: 'henry', replyTo: 'example-user', excerpt: 'feito' }, index)!
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'bubble', actorId: personId('henry'), replyTo: 'example-user' }))
  })

  it('lights the counter lamp on ci results', () => {
    const plan = planEvent({ kind: 'ci', at: 'a', pr, result: 'failure' }, index)!
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'lamp', repo: 'api', color: 'red' }))
  })

  it('celebrates merges with a leaving visitor and confetti', () => {
    const plan = planEvent({ kind: 'merged', at: 'a', pr, queueJump: false }, index)!
    expect(plan.spawns[0].actor.kind).toBe('visitor')
    expect(plan.overrides[0]).toMatchObject({ anim: 'victory' })
    expect(plan.effects.some(e => e.kind === 'confetti')).toBe(true)
  })

  it('rolls a queue jumper past the line with a siren and a sign', () => {
    const plan = planEvent({ kind: 'merged', at: 'a', pr, queueJump: true }, index)!
    const jumper = plan.spawns[0].actor
    const roll = plan.overrides.find(o => o.actorId === jumper.id && o.moveAnim === 'roll')
    expect(roll?.run).toBe(true)
    expect(roll?.target?.[2]).toBeLessThan(jumper.position[2])
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'jumpSign', actorId: jumper.id }))
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'sound', sound: 'siren' }))
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'stamp', variant: 'approved' }))
  })

  it('makes the head of the line protest the jumper', () => {
    const plan = planEvent({ kind: 'merged', at: 'a', pr, queueJump: true }, index)!
    const head = customerId('api', 1)
    expect(plan.overrides).toContainEqual(expect.objectContaining({ actorId: head, anim: 'no' }))
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'bubble', actorId: head }))
  })

  it('drops closed PRs through a trapdoor', () => {
    const plan = planEvent({ kind: 'closed', at: 'a', pr }, index)!
    expect(plan.overrides.at(-1)?.target?.[1]).toBeLessThan(0)
    expect(plan.effects.some(e => e.kind === 'trapdoor')).toBe(true)
  })

  it('ignores repos without a counter', () => {
    expect(planEvent({ kind: 'merged', at: 'a', pr: { ...pr, repo: 'nope' }, queueJump: false }, index)).toBeNull()
  })
})

describe('timeline helpers', () => {
  const plan: Plan = {
    id: 'p',
    repo: 'r',
    duration: 1000,
    overrides: [{ actorId: 'a', at: 0, anim: 'wave' }, { actorId: 'a', at: 500, anim: 'yes' }],
    effects: [{ kind: 'sound', sound: 'ding', at: 200, duration: 0 }, { kind: 'banner', text: 'x', at: 100, duration: 300 }],
    spawns: [{ actor: buildActors(snap, null)[0], from: 0, until: 800 }],
  }

  it('picks the latest started override, later plans winning', () => {
    expect(activeOverride([start(plan)], 'a', 600)?.anim).toBe('yes')
    expect(activeOverride([start(plan), start({ ...plan, id: 'q', overrides: [{ actorId: 'a', at: 0, anim: 'no' }] }, 100)], 'a', 600)?.anim).toBe('no')
    expect(activeOverride([start(plan)], 'a', 1500)).toBeNull()
  })

  it('windows effects and spawns', () => {
    expect(activeEffects([start(plan)], 150).map(e => e.kind)).toEqual(['banner'])
    expect(activeEffects([start(plan)], 450)).toEqual([])
    expect(activeSpawns([start(plan)], 900)).toEqual([])
  })

  it('fires each sound once', () => {
    const fired = new Set<string>()
    const first = dueSounds([start(plan)], 300, fired)
    first.forEach(s => fired.add(s.key))
    expect(first.map(s => s.sound)).toEqual(['ding'])
    expect(dueSounds([start(plan)], 400, fired)).toEqual([])
  })

  it('runs one plan per repo and caps concurrency', () => {
    const event: SceneEvent = { kind: 'merged', at: 'a', pr: { ...pr, repo: 'r' }, queueJump: false }
    expect(canStartEvent([start(plan)], event)).toBe(false)
    expect(canStartEvent([start(plan)], { ...event, pr: { ...pr, repo: 'other' } })).toBe(true)
    const busy = Array.from({ length: MAX_CONCURRENT_PLANS }, (_, i) => start({ ...plan, id: `${i}`, repo: `x${i}` }))
    expect(canStartEvent(busy, { ...event, pr: { ...pr, repo: 'other' } })).toBe(false)
  })
})

describe('activeBubbles', () => {
  const talk = (id: string, actorId: string, startedAt: number): StartedPlan => ({
    id,
    repo: null,
    duration: 5000,
    overrides: [],
    effects: [{ kind: 'bubble', actorId, text: id, replyTo: null, at: 0, duration: 5000 }],
    spawns: [],
    startedAt,
  })

  it('keeps only the newest bubbles, oldest leaving first', () => {
    const plans = Array.from({ length: MAX_BUBBLES + 2 }, (_, i) => talk(`p${i}`, `a${i}`, i * 100))
    const bubbles = activeBubbles(plans, 1000)
    expect(bubbles.size).toBe(MAX_BUBBLES)
    expect(bubbles.has('a0')).toBe(false)
    expect(bubbles.has('a1')).toBe(false)
    expect(bubbles.get(`a${MAX_BUBBLES + 1}`)?.text).toBe(`p${MAX_BUBBLES + 1}`)
  })

  it('shows one bubble per speaker, the latest', () => {
    const bubbles = activeBubbles([talk('old', 'a', 0), talk('new', 'a', 200)], 300)
    expect(bubbles.get('a')?.text).toBe('new')
  })
})

describe('advanceDirector', () => {
  it('follows real time on normal ticks', () => {
    expect(advanceDirector({ real: 1000, virtual: 500 }, 1250)).toEqual({ real: 1250, virtual: 750 })
  })

  it('caps a stalled tick at one second so effects are not skipped', () => {
    expect(advanceDirector({ real: 1000, virtual: 500 }, 15_000)).toEqual({ real: 15_000, virtual: 1500 })
    expect(advanceDirector({ real: 1000, virtual: 500 }, 900).virtual).toBe(500)
  })
})
