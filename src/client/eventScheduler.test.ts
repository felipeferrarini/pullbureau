import { describe, expect, it } from 'vitest'
import type { SceneEvent } from '@/types/domain'
import { MAX_EVENTS_PER_CYCLE, eventKey, selectNewEvents } from './eventScheduler'

const NOW = new Date('2026-10-15T15:00:00Z')
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString()
const event = (m: number, number = 1): SceneEvent => ({ kind: 'merged', at: minutesAgo(m), pr: { repo: 'r', number, title: 't', url: 'u', author: 'a' }, queueJump: false })

describe('selectNewEvents', () => {
  const events = [event(60), event(20), event(10), event(1)]

  it('plays only the last 15 minutes on first load', () => {
    const result = selectNewEvents(events, null, NOW)
    expect(result.toPlay.map(e => e.at)).toEqual([minutesAgo(10), minutesAgo(1)])
    expect(result.cursor).toBe(minutesAgo(1))
  })

  it('plays everything after a valid cursor', () => {
    expect(selectNewEvents(events, minutesAgo(30), NOW).toPlay).toHaveLength(3)
  })

  it('falls back to the first-load window when the cursor is invalid or in the future', () => {
    expect(selectNewEvents(events, 'not-a-date', NOW).toPlay).toHaveLength(2)
    expect(selectNewEvents(events, new Date(NOW.getTime() + 60_000).toISOString(), NOW).toPlay).toHaveLength(2)
  })

  it('never plays events from the future and keeps the cursor when nothing is new', () => {
    const future: SceneEvent = { ...event(0), at: new Date(NOW.getTime() + 60_000).toISOString() }
    const result = selectNewEvents([future], minutesAgo(5), NOW)
    expect(result.toPlay).toEqual([])
    expect(result.cursor).toBe(minutesAgo(5))
  })

  it('caps the batch, keeping the newest events', () => {
    const many = Array.from({ length: 40 }, (_, i) => event(40 - i, i))
    const result = selectNewEvents(many, minutesAgo(50), NOW)
    expect(result.toPlay).toHaveLength(MAX_EVENTS_PER_CYCLE)
    expect(result.skipped).toBe(10)
    expect(result.toPlay.at(-1)?.pr.number).toBe(39)
  })

  it('plays a late event that shows up behind the cursor', () => {
    const lateMerge = event(5, 7)
    expect(selectNewEvents([lateMerge], minutesAgo(1), NOW).toPlay).toEqual([lateMerge])
  })

  it('does not replay events it already played', () => {
    const merge = event(5, 7)
    const first = selectNewEvents([merge], minutesAgo(10), NOW)
    expect(first.toPlay).toEqual([merge])
    expect(selectNewEvents([merge], first.cursor, NOW, first.played).toPlay).toEqual([])
  })

  it('remembers played keys only while they can still show up late', () => {
    const result = selectNewEvents([event(2, 8)], minutesAgo(3), NOW, [eventKey(event(60, 9))])
    expect(result.played).toEqual([eventKey(event(2, 8))])
  })
})
