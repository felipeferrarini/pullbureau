import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('presentation configuration', () => {
  it('defaults to UTC and standard business hours without environment settings', async () => {
    vi.stubEnv('TIME_ZONE', undefined)
    vi.stubEnv('BUSINESS_START_HOUR', undefined)
    vi.stubEnv('BUSINESS_END_HOUR', undefined)
    vi.resetModules()
    const config = await import('./constants')
    expect(config.TIME_ZONE).toBe('UTC')
    expect([config.BUSINESS_START_HOUR, config.BUSINESS_END_HOUR]).toEqual([9, 18])
  })
  it('accepts a configured timezone and business day', async () => {
    vi.stubEnv('TIME_ZONE', 'America/New_York')
    vi.stubEnv('BUSINESS_START_HOUR', '8')
    vi.stubEnv('BUSINESS_END_HOUR', '16')
    vi.resetModules()
    const { isBusinessTime } = await import('@/domain/time')
    expect(isBusinessTime(new Date('2026-10-15T12:00:00Z'))).toBe(true)
    expect(isBusinessTime(new Date('2026-10-15T20:00:00Z'))).toBe(false)
  })
  it('rejects invalid business hours and timezone settings', async () => {
    vi.stubEnv('BUSINESS_START_HOUR', '18')
    vi.stubEnv('BUSINESS_END_HOUR', '9')
    vi.resetModules()
    await expect(import('./constants')).rejects.toThrow('BUSINESS_END_HOUR')
    vi.stubEnv('BUSINESS_START_HOUR', '9')
    vi.stubEnv('BUSINESS_END_HOUR', '18')
    vi.stubEnv('TIME_ZONE', 'invalid')
    vi.resetModules()
    await expect(import('./constants')).rejects.toThrow()
  })
})
