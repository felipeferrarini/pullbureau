import type { CobwebLevel, CobwebLook } from '@/types/scene'

export const COBWEB_LIGHT_DAYS = 14
export const COBWEB_FULL_DAYS = 30
export const COBWEB_HEAVY_DAYS = 60

const LOOKS: Record<CobwebLevel, CobwebLook> = {
  0: { web: null, twin: false, spider: false, motes: 0, dust: 0 },
  1: { web: 'small', twin: false, spider: false, motes: 2, dust: 0.14 },
  2: { web: 'large', twin: false, spider: true, motes: 4, dust: 0.26 },
  3: { web: 'large', twin: true, spider: true, motes: 7, dust: 0.42 },
}

export function cobwebLevel(ageDays: number): CobwebLevel {
  if (ageDays >= COBWEB_HEAVY_DAYS) return 3
  if (ageDays >= COBWEB_FULL_DAYS) return 2
  return ageDays >= COBWEB_LIGHT_DAYS ? 1 : 0
}

export const cobwebLook = (level: CobwebLevel): CobwebLook => LOOKS[level]
