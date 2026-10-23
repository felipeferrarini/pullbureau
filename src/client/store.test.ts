import { beforeEach, describe, expect, it } from 'vitest'
import type { SceneEvent, Snapshot } from '@/types/domain'
import { MAX_PENDING_EVENTS, useAppStore } from './store'

const event = (repo: string, number: number): SceneEvent => ({ kind: 'merged', at: 'a', pr: { repo, number, title: 't', url: 'u', author: 'x' }, queueJump: false })

describe('useAppStore', () => {
  beforeEach(() => useAppStore.setState({ pendingEvents: [], snapshot: null }))

  it('appends received events and caps the backlog', () => {
    const events = Array.from({ length: MAX_PENDING_EVENTS + 5 }, (_, i) => event('r', i))
    useAppStore.getState().receive({} as Snapshot, events, 0)
    expect(useAppStore.getState().pendingEvents).toHaveLength(MAX_PENDING_EVENTS)
    expect(useAppStore.getState().pendingEvents[0].pr.number).toBe(5)
  })

  it('takes the first acceptable event and leaves the rest', () => {
    useAppStore.getState().receive({} as Snapshot, [event('a', 1), event('b', 2), event('b', 3)], 0)
    expect(useAppStore.getState().takeEventWhere(e => e.pr.repo === 'b')?.pr.number).toBe(2)
    expect(useAppStore.getState().pendingEvents.map(e => e.pr.number)).toEqual([1, 3])
    expect(useAppStore.getState().takeEventWhere(() => false)).toBeUndefined()
  })

  it('remembers which replay is playing so the hud can flag fake data', () => {
    expect(useAppStore.getState().replay).toBeNull()
    useAppStore.getState().setReplay('demo')
    expect(useAppStore.getState().replay).toBe('demo')
  })

  it('keeps the latest ticker notices until they are dropped', () => {
    const { pushNotice, dropNotice } = useAppStore.getState()
    ;['a', 'b', 'c', 'd'].forEach(id => pushNotice({ id, text: id, tone: 'alert' }))
    expect(useAppStore.getState().notices.map(n => n.id)).toEqual(['d', 'c', 'b'])
    dropNotice('c')
    expect(useAppStore.getState().notices.map(n => n.id)).toEqual(['d', 'b'])
  })

  it('follows a pr until the camera focus changes', () => {
    useAppStore.getState().follow({ repo: 'a', number: 1 })
    expect(useAppStore.getState().following).toEqual({ repo: 'a', number: 1 })
    useAppStore.getState().focus('b')
    expect(useAppStore.getState().following).toBeNull()
  })

  it('swaps between a counter focus and a scene spot', () => {
    useAppStore.getState().focus('b')
    useAppStore.getState().focusSpot('board')
    expect(useAppStore.getState()).toMatchObject({ spot: 'board', focusRepo: null })
    useAppStore.getState().focus(null)
    expect(useAppStore.getState().spot).toBeNull()
  })
})
