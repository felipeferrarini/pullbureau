import { DAY_MS } from '@/domain/time'
import type { SceneEvent } from '@/types/domain'

export const FIRST_LOAD_LOOKBACK_MS = 15 * 60_000
export const MAX_EVENTS_PER_CYCLE = 30
// History (merges, closes) is cached for 10 min on the server, so its events can arrive that late.
export const LATE_EVENT_MS = 12 * 60_000

export type ScheduleResult = { toPlay: SceneEvent[]; skipped: number; cursor: string; played: string[] }

function floorFor(cursor: string | null, nowMs: number): number {
  const saved = cursor ? Date.parse(cursor) : Number.NaN
  if (Number.isFinite(saved) && saved <= nowMs) return Math.max(saved, nowMs - DAY_MS)
  return nowMs - FIRST_LOAD_LOOKBACK_MS
}

function actorOf(event: SceneEvent): string {
  if (event.kind === 'review') return event.reviewer
  if (event.kind === 'comment') return event.author
  return ''
}

export const eventKey = (event: SceneEvent) => `${event.kind}|${event.pr.repo}#${event.pr.number}|${event.at}|${actorOf(event)}`

const keyTime = (key: string) => Date.parse(key.split('|')[2] ?? '')

export function selectNewEvents(events: SceneEvent[], cursor: string | null, now: Date, played: string[] = []): ScheduleResult {
  const nowMs = now.getTime()
  const floor = floorFor(cursor, nowMs)
  const lookFrom = Math.min(floor, nowMs - LATE_EVENT_MS)
  const seen = new Set(played)
  const fresh = events.filter(event => {
    const at = Date.parse(event.at)
    return at > lookFrom && at <= nowMs && !seen.has(eventKey(event))
  })
  const toPlay = fresh.slice(-MAX_EVENTS_PER_CYCLE)
  const newest = Math.max(floor, ...fresh.map(event => Date.parse(event.at)))
  const remembered = [...played.filter(key => keyTime(key) > lookFrom), ...fresh.map(eventKey)]
  return { toPlay, skipped: fresh.length - toPlay.length, cursor: new Date(newest).toISOString(), played: remembered }
}
