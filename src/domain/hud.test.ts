import { describe, expect, it } from 'vitest'
import { findQueued } from './hud'
import { counter, queuedPr, snapshot } from './testFactories'

const snap = snapshot({
  counters: [counter({ repo: 'api', queue: [queuedPr({ number: 1, ageDays: 2 })], attendants: [] })],
  waitingRoom: [queuedPr({ number: 9, isDraft: true })],
})

describe('findQueued', () => {
  it('finds PRs in the queues and the waiting room', () => {
    expect(findQueued(snap, { repo: 'api', number: 9 })?.isDraft).toBe(true)
    expect(findQueued(snap, { repo: 'api', number: 7 })).toBeNull()
  })
})
