import { CHARACTER_BY_ID, CHARACTER_HEIGHT } from '@/shared/characters'
import { hashString } from '@/shared/hash'
import type { Actor } from '@/types/scene'

// Last frame of the pack's SitDown clip, measured on the skinned mesh (every humanoid shares the rig).
// In model units: the underside of the hips rests 0.456 above the floor and 0.42 behind the feet.
const SEAT_UNITS = 0.4563
const HIP_BACK_UNITS = 0.4196
const FALLBACK_HEIGHT = 3.2

export const CHAIR_SEAT = 0.48 // cushion top of the chair-waiting prop
export const PULL_S = 0.5
export const FOLD_S = 0.3
export const PULL_FROM = 0.55 // how far behind the seat the stool starts its slide
export const STOOL_COLORS = ['#d8432f', '#2f6fd1', '#f2b632', '#3a9d5d', '#ece7dc', '#a8743f']

export type Seat = { height: number; back: number }
export type StoolPhase = { seated: boolean; since: number }
export type StoolPose = { slide: number; scale: number }

export function seatFor(modelHeight: number): Seat {
  const scale = CHARACTER_HEIGHT / modelHeight
  return { height: SEAT_UNITS * scale, back: HIP_BACK_UNITS * scale }
}

export const seatOf = (modelId: string) => seatFor(CHARACTER_BY_ID.get(modelId)?.height ?? FALLBACK_HEIGHT)

export const chairLift = (seat: Seat) => Math.max(0, CHAIR_SEAT - seat.height)

export const wantsStool = (actor: Pick<Actor, 'kind' | 'anim'>) => actor.kind === 'customer' && actor.anim === 'sit'

export const stoolColor = (actorId: string) => STOOL_COLORS[hashString(actorId) % STOOL_COLORS.length]

// Someone already seated when first seen keeps a stool that was always there.
export function nextStoolPhase(phase: StoolPhase | null, seated: boolean, now: number): StoolPhase {
  if (!phase) return { seated, since: -Infinity }
  return phase.seated === seated ? phase : { seated, since: now }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const easeOut = (t: number) => 1 - (1 - t) ** 3

export function stoolPose(phase: StoolPhase, now: number): StoolPose {
  const elapsed = now - phase.since
  if (phase.seated) return { slide: 1 - easeOut(clamp01(elapsed / PULL_S)), scale: 1 }
  return { slide: 0, scale: 1 - clamp01(elapsed / FOLD_S) }
}

export const sitsDown = (phase: StoolPhase, now: number) => phase.seated && now - phase.since >= PULL_S
