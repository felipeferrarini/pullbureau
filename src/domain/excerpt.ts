import { t } from '@/i18n'
export function toExcerpt(body: string, max = 60): string {
  const text = body
    .replace(/```[\s\S]*?```/g, ` ${t('excerpt.code')} `)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~#>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return '...'
  const chars = Array.from(text)
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('').trimEnd()}…`
}
