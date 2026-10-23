import type { KonamiMatcher } from '@/types/eggs'

export const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

const CODE = KONAMI_CODE.map(key => key.toLowerCase())

export function createKonamiMatcher(): KonamiMatcher {
  let typed: string[] = []
  return key => {
    typed = [...typed, key.toLowerCase()].slice(-CODE.length)
    const matched = typed.length === CODE.length && typed.every((value, i) => value === CODE[i])
    if (matched) typed = []
    return matched
  }
}
