import { SIDEWALK_Y } from '@/scene/outside/street'
import type { HeliPose, HeliTiming, RotorKey } from '@/types/eggs'
import type { Vec3 } from '@/types/scene'

// The sidewalk square at the foot of the steps: as close to the door as the rotor allows, so the
// overview camera still sees the cabin over the ticker. The blades pass under the portico roof.
export const HELI_LANDING: Vec3 = [0, SIDEWALK_Y, 10.7]
export const HELI_HEADING = Math.PI / 2 // nose along the street, towards +x
export const HELI_EXIT: Vec3 = [-0.15, 0, 9.7]
export const HELI_HALF_WIDTH = 0.9
export const ROTOR_RADIUS = 2.8
export const ROTOR_IDLE = 0.55

const APPROACH_MS = 8500
const DESCEND_MS = 4000
const SETTLE_MS = 1200
const BOARD_MS = 1200
const SPOOL_MS = 1800
const LIFT_MS = 3500
const DEPART_MS = 10_000
const IDLE_AFTER_MS = 2200
const HOVER = 8.5
const WASH_HEIGHT = 7
const DOOR_MS = 450

type Path = [Vec3, Vec3, Vec3, Vec3]

export const HELI_TOUCHDOWN_MS = APPROACH_MS + DESCEND_MS

const hoverAt = (): Vec3 => [HELI_LANDING[0], HELI_LANDING[1] + HOVER, HELI_LANDING[2]]
const APPROACH: Path = [[-95, 19, 16], [-50, 16, 19], [-16, 11, 15], hoverAt()]
const DEPART: Path = [hoverAt(), [18, 10.5, 14.5], [48, 16, 9], [105, 27, -12]]

export function heliTiming(onFootMs: number): HeliTiming {
  const touchdown = HELI_TOUCHDOWN_MS
  const exit = touchdown + SETTLE_MS
  const board = exit + onFootMs
  const liftoff = board + BOARD_MS + SPOOL_MS
  return { touchdown, exit, board, liftoff, gone: liftoff + LIFT_MS + DEPART_MS }
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t ** 3

function bezier([a, b, c, d]: Path, t: number): Vec3 {
  const u = 1 - t
  return [0, 1, 2].map(i => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]) as Vec3
}

function heading(path: Path, t: number): number {
  const ahead = bezier(path, Math.min(1, t + 0.01))
  const here = bezier(path, Math.max(0, t - 0.01))
  return Math.atan2(ahead[0] - here[0], ahead[2] - here[2])
}

function rotorAt(t: number, timing: HeliTiming): number {
  if (t < timing.touchdown) return 1
  const spool = timing.liftoff - SPOOL_MS
  if (t < spool) return lerp(1, ROTOR_IDLE, smooth(clamp01((t - timing.touchdown) / IDLE_AFTER_MS)))
  return lerp(ROTOR_IDLE, 1, smooth(clamp01((t - spool) / SPOOL_MS)))
}

type Flight = Pick<HeliPose, 'phase' | 'position' | 'yaw' | 'pitch' | 'roll'>

function flight(t: number, timing: HeliTiming): Flight {
  if (t < APPROACH_MS) {
    const u = t / APPROACH_MS
    const s = easeOut(u)
    const yaw = lerp(heading(APPROACH, s), HELI_HEADING, smooth(clamp01((u - 0.6) / 0.4)))
    return { phase: 'approach', position: bezier(APPROACH, s), yaw, pitch: lerp(0.16, -0.18, smooth(clamp01((u - 0.45) / 0.55))), roll: Math.sin(u * Math.PI) * 0.1 }
  }
  if (t < timing.touchdown) {
    const u = (t - APPROACH_MS) / DESCEND_MS
    const position: Vec3 = [HELI_LANDING[0], lerp(HELI_LANDING[1] + HOVER, HELI_LANDING[1], smooth(u)), HELI_LANDING[2]]
    return { phase: 'descend', position, yaw: HELI_HEADING, pitch: -0.18 * (1 - smooth(u)), roll: 0 }
  }
  const lift = timing.liftoff
  if (t < lift) return { phase: 'landed', position: HELI_LANDING, yaw: HELI_HEADING, pitch: 0, roll: 0 }
  if (t < lift + LIFT_MS) {
    const u = (t - lift) / LIFT_MS
    const position: Vec3 = [HELI_LANDING[0], lerp(HELI_LANDING[1], HELI_LANDING[1] + HOVER, smooth(u)), HELI_LANDING[2]]
    return { phase: 'lift', position, yaw: HELI_HEADING, pitch: 0.06 * Math.sin(u * Math.PI), roll: 0 }
  }
  if (t <= timing.gone) {
    const u = (t - lift - LIFT_MS) / DEPART_MS
    const s = easeIn(u)
    return { phase: 'depart', position: bezier(DEPART, s), yaw: lerp(HELI_HEADING, heading(DEPART, s), smooth(clamp01(u * 3))), pitch: lerp(0, 0.2, smooth(clamp01(u * 4))), roll: -Math.sin(u * Math.PI) * 0.12 }
  }
  return { phase: 'gone', position: DEPART[3], yaw: HELI_HEADING, pitch: 0, roll: 0 }
}

// Pitch is positive nose-down (the model leans into the flight), roll banks into the turn.
export function heliPose(t: number, timing: HeliTiming): HeliPose {
  const pose = flight(t, timing)
  const rotor = pose.phase === 'gone' ? 0 : rotorAt(t, timing)
  const height = pose.position[1] - HELI_LANDING[1]
  return { ...pose, rotor, wash: rotor * clamp01(1 - height / WASH_HEIGHT) }
}

const doorWindow = (t: number, at: number) => clamp01(1 - (Math.abs(t - at) - 700) / DOOR_MS)

export function doorOpen(t: number, timing: HeliTiming): number {
  return Math.max(doorWindow(t, timing.exit), doorWindow(t, timing.board))
}

// Volume and chop rate along the visit, in seconds from when the sound starts.
export function rotorKeys(timing: HeliTiming, fromMs: number): RotorKey[] {
  const keys: RotorKey[] = [
    { at: 0, gain: 0, rate: 11 },
    { at: APPROACH_MS * 0.7, gain: 0.55, rate: 11 },
    { at: timing.touchdown, gain: 0.9, rate: 11 },
    { at: timing.touchdown + IDLE_AFTER_MS, gain: 0.42, rate: 7 },
    { at: timing.liftoff - SPOOL_MS, gain: 0.42, rate: 7 },
    { at: timing.liftoff, gain: 0.95, rate: 11.5 },
    { at: timing.liftoff + LIFT_MS, gain: 0.8, rate: 11.5 },
    { at: timing.gone, gain: 0, rate: 11.5 },
  ]
  const next = keys.findIndex(key => key.at > fromMs)
  if (next < 0) return [{ at: 0, gain: 0, rate: keys[keys.length - 1].rate }]
  const before = keys[Math.max(0, next - 1)]
  const after = keys[next]
  const k = next === 0 ? 0 : (fromMs - before.at) / (after.at - before.at)
  const start: RotorKey = { at: 0, gain: lerp(before.gain, after.gain, k), rate: lerp(before.rate, after.rate, k) }
  return [start, ...keys.slice(next).map(key => ({ ...key, at: (key.at - fromMs) / 1000 }))]
}
