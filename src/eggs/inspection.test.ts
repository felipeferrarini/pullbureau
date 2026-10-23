import { describe, expect, it } from 'vitest'
import { counter, person, queuedPr, snapshot } from '@/domain/testFactories'
import { buildActors, buildSceneIndex, customerId, personId } from '@/scene/actors'
import { counterX, doorSpot } from '@/scene/layout'
import { HELI_EXIT, heliTiming } from './helicopter'
import { HELI_NOTICE, INSPECTION_EVERY_MS, inspectionBlocked, inspectionLine, isInspector, planInspection } from './inspection'

const snap = snapshot({
  counters: [
    counter({ repo: 'api', attendants: [], queue: [queuedPr({ number: 1, author: 'alice' }), queuedPr({ number: 2, author: 'alice', ageDays: 20 }), queuedPr({ number: 3 })] }),
    counter({ repo: 'students', attendants: [], queue: [queuedPr({ repo: 'students', number: 4, author: 'alice' })] }),
  ],
  people: [person('example-user'), person('alice'), person('henry', 'students')],
})
const index = buildSceneIndex(snap, buildActors(snap, null))
const plan = planInspection(snap, index, 'alice')
const ctoId = plan.spawns[0].actor.id

describe('planInspection', () => {
  const heli = plan.effects.find(effect => effect.kind === 'helicopter')
  const timing = heli?.kind === 'helicopter' ? heli.timing : heliTiming(0)
  const cto = plan.overrides.filter(o => o.actorId === ctoId)

  it('flies the cto in by helicopter for the whole visit', () => {
    expect(heli).toMatchObject({ at: 0, duration: plan.duration })
    expect(plan.duration).toBe(timing.gone)
    expect(isInspector(ctoId)).toBe(true)
    expect(plan.repo).toBeNull()
  })

  it('has him step out after touchdown, walk in through the front door and board again before take-off', () => {
    expect(plan.spawns[0]).toMatchObject({ from: timing.exit, until: timing.board })
    expect(plan.spawns[0].actor).toMatchObject({ login: 'alice', position: HELI_EXIT })
    expect(cto[0]).toMatchObject({ at: timing.exit, target: doorSpot() })
    expect(cto.at(-1)?.target).toEqual(HELI_EXIT)
    expect(cto.at(-1)?.at).toBeLessThan(timing.board)
    expect(timing.exit).toBeGreaterThan(timing.touchdown)
  })

  it('has someone warn the others once the helicopter touches down', () => {
    const warning = plan.effects.find(e => e.kind === 'bubble' && e.text === 'Disfarça, é a fiscalização!')
    expect(warning).toMatchObject({ actorId: personId('example-user') })
    expect(warning?.at).toBeGreaterThanOrEqual(timing.touchdown)
    expect(warning?.at).toBeLessThan(timing.exit + 2000)
  })

  it('says his line only after he walked in', () => {
    const line = plan.effects.find(e => e.kind === 'bubble' && e.actorId === ctoId)
    expect(line?.at).toBeGreaterThan(timing.exit + 3000)
  })

  it('walks along the queue with most of his PRs and counts all of them', () => {
    const stops = plan.overrides.filter(o => o.actorId === ctoId && o.target).map(o => o.target?.[0])
    expect(stops[1]).toBeCloseTo(counterX(0, 2) + 1.1)
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'bubble', actorId: ctoId, text: '…essas 3 aqui são minhas?' }))
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'bubble', text: '💧' }))
  })

  it('wakes sleepers and sends copa attendants running, but not the cto himself', () => {
    expect(plan.overrides).toContainEqual(expect.objectContaining({ actorId: customerId('api', 2), anim: 'idle' }))
    expect(plan.overrides).toContainEqual(expect.objectContaining({ actorId: personId('example-user'), run: true }))
    expect(plan.overrides.some(o => o.actorId === personId('alice'))).toBe(false)
    expect(plan.overrides.some(o => o.actorId === personId('henry'))).toBe(false)
  })

  it('lets the hall relax once he boards again', () => {
    expect(plan.overrides).toContainEqual(expect.objectContaining({ actorId: customerId('api', 2), anim: 'sit', at: timing.board }))
    const backToCopa = plan.overrides.find(o => o.actorId === personId('example-user') && o.at === timing.board)
    expect(backToCopa?.target).toEqual(index.actors.get(personId('example-user'))?.position)
  })

  it('leaves satisfied when none of the PRs are his', () => {
    const calm = planInspection(snapshot({ counters: [counter({ repo: 'r', attendants: [], queue: [queuedPr({ repo: 'r' })] })] }), index, 'alice')
    expect(calm.effects).toContainEqual(expect.objectContaining({ kind: 'bubble', text: 'Muito bem, pessoal.' }))
    expect(calm.effects.some(e => e.kind === 'bubble' && e.text === '💧')).toBe(false)
  })
})

describe('inspection timing', () => {
  const open = { introOver: true, duel: false, inspectingUntil: 0, now: 1000 }

  it('comes every 5 minutes', () => {
    expect(INSPECTION_EVERY_MS).toBe(5 * 60_000)
  })

  it('never lands during the intro, a duel or another inspection', () => {
    expect(inspectionBlocked(open)).toBe(false)
    expect(inspectionBlocked({ ...open, introOver: false })).toBe(true)
    expect(inspectionBlocked({ ...open, duel: true })).toBe(true)
    expect(inspectionBlocked({ ...open, inspectingUntil: 2000 })).toBe(true)
  })

  it('announces the helicopter on the ticker', () => {
    expect(HELI_NOTICE).toBe('🚁 Fiscalização chegou de helicóptero')
  })

  it('phrases the line by count', () => {
    expect(inspectionLine(34)).toBe('…essas 34 aqui são minhas?')
    expect(inspectionLine(0)).toBe('Muito bem, pessoal.')
  })
})
