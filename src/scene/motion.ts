import type { Vec3 } from '@/types/scene'

export const WALK_SPEED = 1.6
export const RUN_SPEED = 4.5
export const ARRIVE_EPSILON = 0.05
export const TURN_RATE = 8

export const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

export function stepTowards(current: Vec3, target: Vec3, maxStep: number): { next: Vec3; moving: boolean; heading: number | null } {
  const delta: Vec3 = [target[0] - current[0], target[1] - current[1], target[2] - current[2]]
  const length = Math.hypot(...delta)
  if (length <= ARRIVE_EPSILON) return { next: target, moving: false, heading: null }
  const k = Math.min(length, maxStep) / length
  const horizontal = Math.abs(delta[0]) + Math.abs(delta[2]) > 1e-6
  return {
    next: [current[0] + delta[0] * k, current[1] + delta[1] * k, current[2] + delta[2] * k],
    moving: true,
    heading: horizontal ? Math.atan2(delta[0], delta[2]) : null,
  }
}

export function lerpAngle(from: number, to: number, t: number): number {
  const full = 2 * Math.PI
  const delta = ((((to - from) % full) + full * 1.5) % full) - Math.PI
  return from + delta * Math.min(1, Math.max(0, t))
}
