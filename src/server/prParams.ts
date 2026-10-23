import type { PrKey } from '@/types/domain'

export function parsePrParams(repo: string, number: string): PrKey | null {
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(repo)) return null
  if (!/^\d{1,7}$/.test(number)) return null
  const parsed = Number(number)
  return parsed > 0 ? { repo, number: parsed } : null
}
