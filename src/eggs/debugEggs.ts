import type { EggName } from '@/types/eggs'

export const EGG_NAMES: EggName[] = ['caramelo', 'furafila', 'aniversario', 'sexta', 'baile', 'cafe']

// `?egg=baile` (or `?egg=caramelo,sexta`) plays hidden eggs on demand.
export function debugEggs(value: string | null): Set<EggName> {
  const wanted = (value ?? '').toLowerCase().split(/[\s,|+]+/)
  return new Set(EGG_NAMES.filter(name => wanted.includes(name)))
}

export const urlEggs = (): Set<EggName> => (typeof window === 'undefined' ? new Set() : debugEggs(new URLSearchParams(window.location.search).get('egg')))
