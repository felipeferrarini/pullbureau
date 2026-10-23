import type { FrameSignals, ScaleState } from '@/types/scene'

export const MOTION_FPS = 60
export const ECONOMY_FPS = 15
export const IDLE_MS = 60_000
export const MOTION_HOLD_MS = 400
// rAF ticks jitter around the display refresh; a frame a few ms early still counts as on time.
export const FRAME_SLACK_MS = 4

// The scene renders at the tier rate, at full rate while the camera or the user moves, and slows down when nobody touches it.
export function targetFps(signals: FrameSignals, tierFps: number): number {
  if (signals.dragging || signals.now < signals.motionUntil) return Math.max(tierFps, MOTION_FPS)
  if (signals.now - signals.lastInputAt >= IDLE_MS) return Math.min(tierFps, ECONOMY_FPS)
  return tierFps
}

export function frameDue(now: number, lastFrameAt: number, fps: number): boolean {
  return now - lastFrameAt >= 1000 / fps - FRAME_SLACK_MS
}

export function shadowDue(now: number, lastShadowAt: number, hz: number): boolean {
  if (hz <= 0) return false
  return !Number.isFinite(hz) || now - lastShadowAt >= 1000 / hz - FRAME_SLACK_MS
}

export const SCALE_STEP = 0.15
export const MIN_SCALE = 0.7
export const RECOVERY_WINDOWS = 5
const BEHIND = 0.85
const AHEAD = 0.98

// Lowers the resolution while frames keep missing the target, and gives it back only after a run of on-time windows.
export function adaptScale({ scale, streak }: ScaleState, achievedFps: number, wantedFps: number): ScaleState {
  const ratio = achievedFps / wantedFps
  if (ratio < BEHIND) return { scale: Math.max(MIN_SCALE, Math.round((scale - SCALE_STEP) * 100) / 100), streak: 0 }
  if (ratio <= AHEAD || scale >= 1) return { scale, streak: 0 }
  if (streak + 1 < RECOVERY_WINDOWS) return { scale, streak: streak + 1 }
  return { scale: Math.min(1, Math.round((scale + SCALE_STEP / 3) * 100) / 100), streak: 0 }
}

export const MOTION_EPSILON = 1e-4

// Camera matrices compared element by element: easing and damping that have practically settled do not count as motion.
export function moved(before: ArrayLike<number>, after: ArrayLike<number>, epsilon = MOTION_EPSILON): boolean {
  for (let i = 0; i < after.length; i++) if (Math.abs(after[i] - before[i]) > epsilon) return true
  return false
}
