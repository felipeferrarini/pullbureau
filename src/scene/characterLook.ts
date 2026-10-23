import { hashString } from '@/shared/hash'
import type { CharacterLook, IdleRhythm, MaterialRole } from '@/types/scene'

export const SKIN_TONES = ['#f3d2b8', '#e6b894', '#cf9a6e', '#b07a50', '#8a5a3a', '#5e3b27'] as const

const HAIR_HUE = 0.04
const CLOTHES_HUE = 0.06

const unit = (value: number) => (value % 10_000) / 10_000
const spread = (value: number, max: number) => (unit(value) * 2 - 1) * max

export function lookFor(login: string): CharacterLook {
  const hash = hashString(login)
  return {
    skin: SKIN_TONES[hash % SKIN_TONES.length],
    hairHue: spread(hashString(`${login}:hair`), HAIR_HUE),
    clothesHue: spread(hashString(`${login}:clothes`), CLOTHES_HUE),
  }
}

export function materialRole(name: string): MaterialRole {
  if (/^skin/i.test(name)) return 'skin'
  if (/^face/i.test(name)) return 'face'
  if (/hair|moustache|beard/i.test(name)) return 'hair'
  return 'clothes'
}

export function idleRhythm(actorId: string): IdleRhythm {
  return { offset: unit(hashString(`${actorId}:t`)), speed: 0.9 + unit(hashString(`${actorId}:s`)) * 0.2 }
}
