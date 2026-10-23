import { describe, expect, it } from 'vitest'
import type { IntroActor, Vec3 } from '@/types/scene'
import { INTRO_SPREAD_S, introDuration, introPlan, shouldPlayIntro } from './intro'
import { DOOR, FACADE_Z, SIDEWALK } from './layout'

const actor = (id: string, kind: IntroActor['kind'], repo: string | null = null): IntroActor => ({ id, kind, repo })

const actors = [
  actor('pr:a#1', 'customer', 'a'),
  actor('pr:a#2', 'customer', 'a'),
  actor('pr:b#3', 'customer', 'b'),
  actor('pr:a#9', 'waiting', 'a'),
  actor('person:x', 'attendant', 'a'),
  actor('person:y', 'attendant', null),
]
const targets = new Map<string, Vec3>([
  ['pr:a#1', [-2, 0, -6]],
  ['pr:a#2', [-2, 0, -5]],
  ['pr:b#3', [2, 0, FACADE_Z + 2]],
  ['pr:a#9', [6, 0, -4]],
  ['person:x', [-2, 0, -9]],
  ['person:y', [-8, 0, -6]],
])

describe('introPlan', () => {
  const plan = introPlan(actors, targets, 42)

  it('sends attendants first, then the queues counter by counter, then the waiting room', () => {
    expect(plan.map(route => route.actorId)).toEqual(['person:x', 'person:y', 'pr:a#1', 'pr:a#2', 'pr:b#3', 'pr:a#9'])
    const delays = plan.map(route => route.delay)
    expect(delays[0]).toBe(0)
    expect(delays).toEqual([...delays].sort((a, b) => a - b))
    expect(new Set(delays).size).toBe(delays.length)
  })

  it('starts everyone on the sidewalk and walks in through the door', () => {
    for (const route of plan) {
      expect(route.start[2]).toBeGreaterThanOrEqual(SIDEWALK.near)
      expect(route.start[2]).toBeLessThanOrEqual(SIDEWALK.far)
      expect(route.waypoints[0]).toEqual(route.start)
      expect(route.waypoints.at(-1)).toEqual(targets.get(route.actorId))
    }
    expect(plan[0].waypoints).toEqual([plan[0].start, DOOR.outside, DOOR.inside, [-2, 0, -9]])
  })

  it('does not go through the door when the place is outside', () => {
    const outside = plan.find(route => route.actorId === 'pr:b#3')
    expect(outside?.waypoints).toHaveLength(2)
  })

  it('walks round the corner of the building to a place in the side alley', () => {
    const footprint = { minX: -10, maxX: 10, minZ: -11, maxZ: FACADE_Z }
    const alley: Vec3 = [-11.2, 0, 2]
    const route = introPlan([actor('pr:c#4', 'customer', 'c')], new Map([['pr:c#4', alley]]), 3, footprint)[0]
    expect(route.waypoints).toHaveLength(3)
    expect(route.waypoints[1][0]).toBeLessThan(footprint.minX)
    expect(route.waypoints[1][2]).toBeGreaterThan(FACADE_Z)
  })

  it('is deterministic for the same seed', () => {
    expect(introPlan(actors, targets, 42)).toEqual(plan)
    expect(introPlan(actors, targets, 7)).not.toEqual(plan)
  })

  it('skips actors without a target', () => {
    expect(introPlan([...actors, actor('ghost', 'visitor')], targets, 42)).toHaveLength(actors.length)
  })

  it('compresses the departures into about 20 seconds when the crowd is large', () => {
    const crowd = Array.from({ length: 120 }, (_, i) => actor(`pr:r${i % 10}#${i}`, 'customer', `r${i % 10}`))
    const places = new Map<string, Vec3>(crowd.map((a, i) => [a.id, [i % 10, 0, -5]]))
    const last = introPlan(crowd, places, 1).at(-1)?.delay ?? 0
    expect(last).toBeGreaterThan(INTRO_SPREAD_S * 0.9)
    expect(last).toBeLessThanOrEqual(INTRO_SPREAD_S)
  })

  it('keeps small crowds short', () => {
    expect(plan.at(-1)?.delay ?? 0).toBeLessThan(10)
  })
})

describe('introDuration', () => {
  it('is the moment the last actor arrives', () => {
    const route = { actorId: 'a', start: [0, 0, 0] as Vec3, waypoints: [[0, 0, 0], [0, 0, 3], [4, 0, 3]] as Vec3[], delay: 2 }
    expect(introDuration([route], 1)).toBe(9)
    expect(introDuration([])).toBe(0)
  })
})

describe('shouldPlayIntro', () => {
  const params = (query: string) => new URLSearchParams(query)

  it('plays only on the first snapshot and not with intro=0', () => {
    expect(shouldPlayIntro({ isFirstSnapshot: true, params: params('') })).toBe(true)
    expect(shouldPlayIntro({ isFirstSnapshot: true, params: params('replay=demo') })).toBe(true)
    expect(shouldPlayIntro({ isFirstSnapshot: true, params: params('intro=0') })).toBe(false)
    expect(shouldPlayIntro({ isFirstSnapshot: false, params: params('') })).toBe(false)
  })
})
