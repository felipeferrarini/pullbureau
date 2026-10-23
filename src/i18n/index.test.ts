import { describe, expect, it, vi } from 'vitest'
import { domainMessages } from './domain'
import { uiMessages } from './ui'
import { selectLocale, translate } from './index'

describe('deployment locale', () => {
  it('keeps dictionaries complete with matching interpolation parameters', () => {
    const en = { ...domainMessages.en, ...uiMessages.en }
    const pt = { ...domainMessages['pt-BR'], ...uiMessages['pt-BR'] }
    expect(Object.keys(en).sort()).toEqual(Object.keys(pt).sort())
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(en[key].match(/\{\w+\}/g)?.sort() ?? []).toEqual(pt[key].match(/\{\w+\}/g)?.sort() ?? [])
    }
  })

  it('defaults to English and accepts Brazilian Portuguese', () => {
    expect(selectLocale(undefined)).toBe('en')
    expect(selectLocale('pt-BR')).toBe('pt-BR')
    expect(() => selectLocale('fr')).toThrow('LOCALE')
  })
  it('translates and interpolates without changing user content', () => {
    expect(translate('en', 'age.days', { count: 3 })).toBe('3 days')
    expect(translate('pt-BR', 'age.days', { count: 3 })).toBe('3 dias')
    expect(translate('en', 'inspection.count', { count: 2 })).toContain('2')
  })
  it.each(['en', 'pt-BR'])('uses the deployment locale for dates: %s', async locale => {
    vi.stubEnv('LOCALE', locale)
    vi.stubEnv('TIME_ZONE', 'UTC')
    vi.resetModules()
    const { formatDate } = await import('@/shared/format')
    expect(formatDate('2026-10-15T13:00:00Z')).toBe(new Intl.DateTimeFormat(locale, {timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date('2026-10-15T13:00:00Z')))
    vi.unstubAllEnvs()
  })
})
