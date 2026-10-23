import { TIME_ZONE, BUSINESS_START_HOUR, BUSINESS_END_HOUR } from '@/shared/constants'

export const HOUR_MS = 3_600_000
export const DAY_MS = 24 * HOUR_MS
export const WEEK_MS = 7 * DAY_MS
export const MONTH_MS = 30 * DAY_MS

const WEEKDAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])

const localParts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, weekday: 'short', hour: 'numeric', hourCycle: 'h23' })

export function ageInDays(fromIso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(fromIso)) / DAY_MS))
}

export function isWithin(iso: string | null, now: Date, windowMs: number): boolean {
  if (!iso) return false
  const elapsed = now.getTime() - Date.parse(iso)
  return elapsed >= 0 && elapsed <= windowMs
}

export function isBusinessTime(date: Date): boolean {
  const parts = localParts.formatToParts(date)
  const weekday = parts.find(part => part.type === 'weekday')?.value ?? ''
  const hour = Number(parts.find(part => part.type === 'hour')?.value)
  return WEEKDAYS.has(weekday) && hour >= BUSINESS_START_HOUR && hour < BUSINESS_END_HOUR
}

export function businessMsBetween(fromIso: string, now: Date, capMs: number): number {
  return businessDurationMs(Date.parse(fromIso), now.getTime(), capMs)
}

export type LocalClock = { weekday: string; hour: number; minute: number }
type LocalDate = LocalClock & { year: number; month: number; day: number; second: number }

const localDateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE, weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
})

function localDate(ms: number): LocalDate {
  const parts = Object.fromEntries(localDateParts.formatToParts(new Date(ms)).map(part => [part.type, part.value]))
  const number = (type: string) => Number(parts[type])
  return { weekday: parts.weekday, year: number('year'), month: number('month'), day: number('day'), hour: number('hour'), minute: number('minute'), second: number('second') }
}

export function localClock(date: Date): LocalClock {
  const { weekday, hour, minute } = localDate(date.getTime())
  return { weekday, hour, minute }
}

export const isBusinessDay = (date: Date) => WEEKDAYS.has(localClock(date).weekday)

function businessDurationMs(from: number, to: number, cap = Infinity): number {
  let total = 0
  for (let cursor = from; cursor < to && total < cap;) {
    const local = localDate(cursor)
    const withinHour = local.minute * 60_000 + local.second * 1000 + ((cursor % 1000) + 1000) % 1000
    const next = Math.min(to, cursor + HOUR_MS - withinHour)
    if (WEEKDAYS.has(local.weekday) && local.hour >= BUSINESS_START_HOUR && local.hour < BUSINESS_END_HOUR) total += next - cursor
    cursor = next
  }
  return Math.min(total, cap)
}

export function businessHoursBetween(fromIso: string, toIso: string): number {
  return businessDurationMs(Date.parse(fromIso), Date.parse(toIso)) / HOUR_MS
}
