import type { FloorRect, Vec3 } from './scene'

export type Birthday<T> = { pr: T; months: number }

export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night'
export type Sky = { phase: SkyPhase; sun: number }

export type KonamiMatcher = (key: string) => boolean

export type EggName = 'caramelo' | 'furafila' | 'aniversario' | 'sexta' | 'baile' | 'cafe'

export type SignPaint = { board: string; ink: string }
export type StrikeSign = { slogan: string; paint: SignPaint; phase: number; tilt: number }
export type StrikeBanner = { left: [number, number, number]; right: [number, number, number] }
export type StrikeCast = { signs: Map<string, StrikeSign>; banner: StrikeBanner | null }

export type DogZone = FloorRect & { blocked: FloorRect[] }
export type DogActivity = 'wander' | 'sit' | 'visit' | 'nap'
export type DogClicks = { clicks: number[]; love: boolean }

export type BirthdayGuest = { actorId: string; repo: string; number: number; months: number; neighbours: string[]; speaker: string }

export type HeliTiming = { touchdown: number; exit: number; board: number; liftoff: number; gone: number }
export type HeliPhase = 'approach' | 'descend' | 'landed' | 'lift' | 'depart' | 'gone'
export type HeliPose = { phase: HeliPhase; position: Vec3; yaw: number; pitch: number; roll: number; rotor: number; wash: number }
export type RotorKey = { at: number; gain: number; rate: number }
