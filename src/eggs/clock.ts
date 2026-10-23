import { isBusinessDay, localClock } from '@/domain/time'
import type { Sky, SkyPhase } from '@/types/eggs'

const NO_DEPLOY_FROM_HOUR = 16
const COFFEE_HOUR = 15
const COFFEE_MINUTES = 10
const SUNRISE = 6 * 60
const SUNSET = 18 * 60 + 15
const TWILIGHT = 30

const minutesOfDay = (now: Date) => {
  const { hour, minute } = localClock(now)
  return hour * 60 + minute
}

export function isFridayNoDeploy(now: Date): boolean {
  const { weekday, hour } = localClock(now)
  return weekday === 'Fri' && hour >= NO_DEPLOY_FROM_HOUR
}

export function isCoffeeBreak(now: Date): boolean {
  const { hour, minute } = localClock(now)
  return isBusinessDay(now) && hour === COFFEE_HOUR && minute < COFFEE_MINUTES
}

const around = (minutes: number, center: number) => minutes >= center - TWILIGHT && minutes < center + TWILIGHT

function phaseAt(minutes: number): SkyPhase {
  if (around(minutes, SUNRISE)) return 'dawn'
  if (around(minutes, SUNSET)) return 'dusk'
  return minutes > SUNRISE && minutes < SUNSET ? 'day' : 'night'
}

export function skyPhase(now: Date): Sky {
  const minutes = minutesOfDay(now)
  return { phase: phaseAt(minutes), sun: Math.min(1, Math.max(0, (minutes - SUNRISE) / (SUNSET - SUNRISE))) }
}

const OVERRIDE = /^(\d{1,2}):(\d{2})$/
const MINUTE_MS = 60_000

// `?hora=HH:mm` moves the scene clock to the configured local time, today.
export function clockOverride(value: string | null, now: Date): Date | null {
  const match = value ? OVERRIDE.exec(value) : null
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  const wanted = hour * 60 + minute
  const startOfMinute = now.getTime() - (now.getTime() % MINUTE_MS)
  return new Date(startOfMinute + (wanted - minutesOfDay(now)) * MINUTE_MS)
}
