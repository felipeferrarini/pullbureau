import { describe, expect, it } from 'vitest'
import { localClock } from '@/domain/time'
import { clockOverride, isCoffeeBreak, isFridayNoDeploy, skyPhase } from './clock'

const bsb = (local: string) => new Date(`${local}-03:00`)

describe('isFridayNoDeploy', () => {
  it('starts on friday at 16:00 in Brasília and lasts until midnight', () => {
    expect(isFridayNoDeploy(bsb('2026-10-16T15:59:00'))).toBe(false)
    expect(isFridayNoDeploy(bsb('2026-10-16T16:00:00'))).toBe(true)
    expect(isFridayNoDeploy(bsb('2026-10-16T23:59:00'))).toBe(true)
    expect(isFridayNoDeploy(bsb('2026-10-17T00:00:00'))).toBe(false)
    expect(isFridayNoDeploy(bsb('2026-10-15T17:00:00'))).toBe(false)
  })
})

describe('isCoffeeBreak', () => {
  it('runs from 15:00 to 15:10 on business days', () => {
    expect(isCoffeeBreak(bsb('2026-10-15T14:59:00'))).toBe(false)
    expect(isCoffeeBreak(bsb('2026-10-15T15:00:00'))).toBe(true)
    expect(isCoffeeBreak(bsb('2026-10-15T15:09:00'))).toBe(true)
    expect(isCoffeeBreak(bsb('2026-10-15T15:10:00'))).toBe(false)
    expect(isCoffeeBreak(bsb('2026-10-17T15:05:00'))).toBe(false)
  })
})

describe('skyPhase', () => {
  it('follows the Brasília sun with half an hour of twilight around sunrise and sunset', () => {
    expect(skyPhase(bsb('2026-10-15T03:00:00'))).toEqual({ phase: 'night', sun: 0 })
    expect(skyPhase(bsb('2026-10-15T05:45:00')).phase).toBe('dawn')
    expect(skyPhase(bsb('2026-10-15T06:00:00'))).toEqual({ phase: 'dawn', sun: 0 })
    expect(skyPhase(bsb('2026-10-15T12:07:00')).phase).toBe('day')
    expect(skyPhase(bsb('2026-10-15T12:07:00')).sun).toBeCloseTo(0.5, 2)
    expect(skyPhase(bsb('2026-10-15T17:50:00')).phase).toBe('dusk')
    expect(skyPhase(bsb('2026-10-15T18:15:00'))).toEqual({ phase: 'dusk', sun: 1 })
    expect(skyPhase(bsb('2026-10-15T18:44:00')).phase).toBe('dusk')
    expect(skyPhase(bsb('2026-10-15T18:45:00'))).toEqual({ phase: 'night', sun: 1 })
  })
})

describe('clockOverride', () => {
  const now = bsb('2026-10-16T14:37:20')

  it('moves now to the requested Brasília time on the same day', () => {
    const night = clockOverride('21:00', now)
    expect(night && localClock(night)).toMatchObject({ hour: 21, minute: 0, weekday: 'Fri' })
    expect(clockOverride('6:05', now)?.toISOString()).toBe(bsb('2026-10-16T06:05:00').toISOString())
  })

  it('ignores missing or malformed values', () => {
    expect([null, '', '25:00', '12:61', 'meio-dia', '9h'].map(value => clockOverride(value, now))).toEqual([null, null, null, null, null, null])
  })
})
