import { describe, expect, it } from 'vitest'
import { counter, person, queuedPr, snapshot } from '@/domain/testFactories'
import { buildActors, buildSceneIndex, customerId, modelLookup, personId, poseForAge } from './actors'
import { FACING_COUNTER, MAX_INSIDE } from './layout'
import { queueSlot } from './queueLanes'

describe('poseForAge', () => {
  it('ages through standing, sitting, sleeping and skeleton', () => {
    expect([2, 3, 13, 14, 60, 61].map(poseForAge)).toEqual(['standing', 'sitting', 'sitting', 'sleeping', 'sleeping', 'skeleton'])
  })
})

describe('buildActors', () => {
  const queue = Array.from({ length: MAX_INSIDE + 2 }, (_, i) => queuedPr({ number: i + 1, author: i === 0 ? 'jhowr' : 'example-user', ageDays: i === 1 ? 90 : 1 }))
  const snap = snapshot({
    counters: [counter({ repo: 'api', queue, attendants: [] }), counter({ repo: 'students', queue: [], attendants: [] })],
    waitingRoom: [queuedPr({ number: 99, isDraft: true })],
    people: [person('example-user', 'students'), person('henry', 'students'), person('carol', null), person('dave', 'repo-sem-guiche')],
  })

  it('puts each queued PR in its lane slot facing the counter, the overflow further along the same lane', () => {
    const actors = buildActors(snap, null)
    const lengths = [MAX_INSIDE + 2, 0]
    const first = actors.find(a => a.id === customerId('api', 1))
    expect(first).toMatchObject({ kind: 'customer', position: queueSlot(0, 2, 0), facing: FACING_COUNTER, outside: false })
    expect(actors.find(a => a.id === customerId('api', MAX_INSIDE))?.outside).toBe(false)
    expect(actors.find(a => a.id === customerId('api', MAX_INSIDE + 1))).toMatchObject({ outside: false, position: queueSlot(0, 2, MAX_INSIDE, lengths) })
  })

  it('continues every overflow along its own counter lane and marks who is out on the street', () => {
    const long = Array.from({ length: 60 }, (_, i) => queuedPr({ repo: 'students', number: 200 + i, ageDays: 1 }))
    const both = snapshot({ ...snap, counters: [snap.counters[0], counter({ repo: 'students', queue: long, attendants: [] })] })
    const actors = buildActors(both, null)
    const lengths = [MAX_INSIDE + 2, 60]
    expect(actors.find(a => a.id === customerId('students', 200 + MAX_INSIDE))?.position).toEqual(queueSlot(1, 2, MAX_INSIDE, lengths))
    expect(actors.find(a => a.id === customerId('students', 259))?.outside).toBe(true)
  })

  it('uses the skeleton model when available, dust otherwise', () => {
    expect(buildActors(snap, 'skeleton').find(a => a.id === customerId('api', 2))).toMatchObject({ modelId: 'skeleton', dusty: false })
    expect(buildActors(snap, null).find(a => a.id === customerId('api', 2))).toMatchObject({ modelId: 'model-example-user', dusty: true })
  })

  it('gives unknown authors a stable model from the people pool', () => {
    const a = buildActors(snap, null).find(x => x.id === customerId('api', 1))
    const b = buildActors(snap, null).find(x => x.id === customerId('api', 1))
    expect(a?.modelId).toBe(b?.modelId)
    expect(a?.modelId.startsWith('model-')).toBe(true)
  })

  it('seats drafts in the waiting room', () => {
    expect(buildActors(snap, null).find(a => a.id === customerId('api', 99))).toMatchObject({ kind: 'waiting', anim: 'sit' })
  })

  it('puts attendants at their home counter and everyone else in the copa', () => {
    const actors = buildActors(snap, null)
    const felipe = actors.find(a => a.id === personId('example-user'))
    const henry = actors.find(a => a.id === personId('henry'))
    expect(felipe?.repo).toBe('students')
    expect(felipe?.position[0]).not.toBe(henry?.position[0])
    expect(actors.find(a => a.id === personId('carol'))?.repo).toBeNull()
    expect(actors.find(a => a.id === personId('dave'))?.repo).toBeNull()
  })

  it('indexes actors, counters and queue lengths', () => {
    const index = buildSceneIndex(snap, buildActors(snap, null))
    expect(index.counterIndex.get('students')).toBe(1)
    expect(index.queueLength.get('api')).toBe(queue.length)
    expect(index.actors.has(personId('henry'))).toBe(true)
  })
})

describe('modelLookup', () => {
  it('never dresses an unknown author in the cto suit', () => {
    const snap = snapshot({ people: [person('alice', null, 'suit'), person('example-user', null, 'casual')] })
    const modelFor = modelLookup(snap)
    const drawn = Array.from({ length: 40 }, (_, i) => modelFor(`outsider-${i}`))
    expect(drawn).not.toContain('suit')
    expect(modelFor('alice')).toBe('suit')
  })
})

describe('closed counters', () => {
  const snap = snapshot({
    counters: [
      counter({ repo: 'students', queue: [queuedPr({ repo: 'students', number: 1 })], attendants: [] }),
      counter({ repo: 'infra', queue: [queuedPr({ repo: 'infra', number: 2 })], attendants: [] }),
    ],
    people: [person('henry', 'students'), person('frank', 'infra')],
  })
  const actors = buildActors(snap, null, 1)

  it('covers the queue of a closed counter in dust', () => {
    expect(actors.find(a => a.id === customerId('infra', 2))).toMatchObject({ dusty: true, position: queueSlot(1, 1, 0) })
    expect(actors.find(a => a.id === customerId('students', 1))?.dusty).toBe(false)
  })

  it('sends the attendants of a closed counter to the copa', () => {
    expect(actors.find(a => a.id === personId('frank'))?.repo).toBeNull()
    expect(actors.find(a => a.id === personId('henry'))?.repo).toBe('students')
  })

  it('counts only hall counters in the scene index', () => {
    const index = buildSceneIndex(snap, actors, 1)
    expect(index.counterCount).toBe(1)
    expect(index.counterIndex.get('infra')).toBe(1)
  })
})
