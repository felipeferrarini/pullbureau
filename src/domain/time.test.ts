import { describe, expect, it } from 'vitest'
import { HOUR_MS, ageInDays, businessHoursBetween, businessMsBetween, isBusinessTime, isWithin, localClock } from './time'

describe('ageInDays', () => {
  it('floors whole days and never goes negative', () => {
    expect(ageInDays('2026-10-13T16:00:00Z', new Date('2026-10-15T15:00:00Z'))).toBe(1)
    expect(ageInDays('2026-10-16T00:00:00Z', new Date('2026-10-15T15:00:00Z'))).toBe(0)
  })
})

describe('isWithin', () => {
  const now = new Date('2026-10-15T15:00:00Z')
  it('accepts past timestamps inside the window only', () => {
    expect(isWithin('2026-10-15T14:00:00Z', now, 2 * HOUR_MS)).toBe(true)
    expect(isWithin('2026-10-15T12:00:00Z', now, 2 * HOUR_MS)).toBe(false)
    expect(isWithin('2026-10-15T16:00:00Z', now, 2 * HOUR_MS)).toBe(false)
    expect(isWithin(null, now, 2 * HOUR_MS)).toBe(false)
  })
})

describe('isBusinessTime (Brasília time, from UTC instants)', () => {
  it('starts at 09:00 and ends before 18:00 local time', () => {
    expect(isBusinessTime(new Date('2026-10-15T11:59:00Z'))).toBe(false) // 08:59 Brasília
    expect(isBusinessTime(new Date('2026-10-15T12:00:00Z'))).toBe(true) // 09:00 Brasília
    expect(isBusinessTime(new Date('2026-10-15T20:59:00Z'))).toBe(true) // 17:59 Brasília
    expect(isBusinessTime(new Date('2026-10-15T21:00:00Z'))).toBe(false) // 18:00 Brasília
  })

  it('skips weekends', () => {
    expect(isBusinessTime(new Date('2026-10-17T15:00:00Z'))).toBe(false) // Saturday 12:00 Brasília
  })
})

describe('businessMsBetween', () => {
  it('counts only business time across a weekend', () => {
    const fridayFivePm = '2026-10-16T20:00:00Z'
    expect(businessMsBetween(fridayFivePm, new Date('2026-10-19T13:00:00Z'), 10 * HOUR_MS)).toBe(2 * HOUR_MS) // Monday 10:00 Brasília
  })

  it('stops counting at the cap', () => {
    expect(businessMsBetween('2026-10-12T12:00:00Z', new Date('2026-10-15T15:00:00Z'), 4 * HOUR_MS)).toBe(4 * HOUR_MS)
  })
})

describe('businessHoursBetween', () => {
  it('counts business hours day by day across nights and weekends', () => {
    expect(businessHoursBetween('2026-10-14T18:00:00Z', '2026-10-15T13:00:00Z')).toBe(4) // Wed 15:00 → Thu 10:00 Brasília
    expect(businessHoursBetween('2026-10-16T20:00:00Z', '2026-10-19T13:00:00Z')).toBe(2) // Fri 17:00 → Mon 10:00 Brasília
    expect(businessHoursBetween('2026-10-12T12:00:00Z', '2026-10-19T12:00:00Z')).toBe(45) // a full working week
  })

  it('handles partial hours, weekends only and reversed ranges', () => {
    expect(businessHoursBetween('2026-10-15T12:30:00Z', '2026-10-15T13:00:00Z')).toBe(0.5)
    expect(businessHoursBetween('2026-10-17T12:00:00Z', '2026-10-18T20:00:00Z')).toBe(0)
    expect(businessHoursBetween('2026-10-15T13:00:00Z', '2026-10-15T12:00:00Z')).toBe(0)
  })
})

describe('localClock', () => {
  it('reads weekday, hour and minute in Brasília', () => {
    expect(localClock(new Date('2026-10-16T19:05:00Z'))).toEqual({ weekday: 'Fri', hour: 16, minute: 5 })
    expect(localClock(new Date('2026-10-17T02:30:00Z'))).toEqual({ weekday: 'Fri', hour: 23, minute: 30 })
  })
})
