import type { SkyPhase } from './eggs'
import type { Vec3 } from './scene'

export type SkyLook = {
  phase: SkyPhase
  zenith: string
  horizon: string
  fog: string
  sunColor: string
  sunIntensity: number
  sunDirection: Vec3
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  envIntensity: number
  night: boolean
  lampsOn: boolean
  stars: number
  interior: number
}

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number }
export type CarLane = { z: number; direction: 1 | -1 }
export type CarPlan = { id: string; model: string; lane: CarLane; speed: number; offset: number }
export type Lot = { x: number; z: number; width: number; depth: number; height: number; color: string; facing: 1 | -1; shop: string | null; seed: number }
