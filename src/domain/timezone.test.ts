import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

it('counts a full business day when DST advances on a working Friday', async () => {
  vi.stubEnv('TIME_ZONE', 'Asia/Jerusalem')
  vi.resetModules()
  const { businessHoursBetween } = await import('./time')
  expect(businessHoursBetween('2026-03-26T22:00:00Z', '2026-03-27T15:00:00Z')).toBe(9)
})

it('counts business hours across a repeated weekend clock hour', async () => {
  vi.stubEnv('TIME_ZONE', 'America/New_York')
  vi.resetModules()
  const { businessHoursBetween } = await import('./time')
  expect(businessHoursBetween('2026-10-30T20:00:00Z', '2026-11-02T15:00:00Z')).toBe(3)
})
