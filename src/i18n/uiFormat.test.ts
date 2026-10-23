import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('deployment schedule presentation', () => {
  it.each(['en', 'pt-BR'])('uses configured business hours and time zone in %s', async locale => {
    vi.stubEnv('LOCALE', locale)
    vi.stubEnv('BUSINESS_START_HOUR', '10')
    vi.stubEnv('BUSINESS_END_HOUR', '16')
    vi.stubEnv('TIME_ZONE', 'Europe/London')
    vi.resetModules()
    const labels = await import('./uiFormat')
    expect(labels.BUSINESS_DAY_HOURS).toBe(6)
    expect(labels.BUSINESS_HOURS_LABEL).toContain('10:00')
    expect(labels.BUSINESS_HOURS_LABEL).toContain(locale === 'en' ? '4:00' : '16:00')
    expect(labels.BEFORE_OPENING_LABEL).toContain('9:59')
    expect(labels.DEPLOYMENT_TIME_ZONE).toBe('Europe/London')
  })
})
