import { domainMessages } from './domain'
import { uiMessages } from './ui'

export type Locale = 'en' | 'pt-BR'

export function selectLocale(value: string | undefined): Locale {
  if (!value) return 'en'
  if (value === 'en' || value === 'pt-BR') return value
  throw new Error('LOCALE must be en or pt-BR')
}

export const LOCALE = selectLocale(process.env.LOCALE)
export const DISPLAY_NAME = process.env.ORG_DISPLAY_NAME || process.env.GITHUB_ORG || 'Acme'

export function translate(locale: Locale, key: string, values: Record<string, string | number> = {}): string {
  const messages: Record<string, string> = { ...domainMessages[locale], ...uiMessages[locale] }
  const message = messages[key]
  if (message === undefined) throw new Error(`Missing translation: ${locale}/${key}`)
  return message.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match))
}

export const t = (key: string, values?: Record<string, string | number>) => translate(LOCALE, key, values)
