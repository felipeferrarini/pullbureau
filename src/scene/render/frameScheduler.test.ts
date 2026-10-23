import { describe, expect, it } from 'vitest'
import { ECONOMY_FPS, IDLE_MS, MIN_SCALE, MOTION_FPS, RECOVERY_WINDOWS, adaptScale, moved, frameDue, shadowDue, targetFps } from './frameScheduler'

const at = (now: number, extra: Partial<Parameters<typeof targetFps>[0]> = {}) => ({ now, lastInputAt: now - 1000, motionUntil: 0, dragging: false, ...extra })

describe('targetFps', () => {
  it('runs at the tier rate while someone is around', () => {
    expect(targetFps(at(10_000), 30)).toBe(30)
  })

  it('goes to full rate while the camera moves or the user drags', () => {
    expect(targetFps(at(10_000, { motionUntil: 10_100 }), 30)).toBe(MOTION_FPS)
    expect(targetFps(at(10_000, { dragging: true }), 30)).toBe(MOTION_FPS)
  })

  it('saves power after a minute without input and wakes on the next one', () => {
    expect(targetFps(at(IDLE_MS + 5000, { lastInputAt: 4000 }), 30)).toBe(ECONOMY_FPS)
    expect(targetFps(at(IDLE_MS + 5000, { lastInputAt: IDLE_MS + 4990 }), 30)).toBe(30)
  })

  it('still moves the camera smoothly in economy mode', () => {
    expect(targetFps(at(IDLE_MS * 2, { lastInputAt: 0, motionUntil: IDLE_MS * 2 + 50 }), 30)).toBe(MOTION_FPS)
  })
})

describe('frameDue', () => {
  it('renders every other 60 Hz tick at 30 fps, tolerating jitter', () => {
    expect(frameDue(1016.7, 1000, 30)).toBe(false)
    expect(frameDue(1031, 1000, 30)).toBe(true)
    expect(frameDue(1033.4, 1000, 30)).toBe(true)
  })
})

describe('shadowDue', () => {
  it('refreshes shadows at their own rate', () => {
    expect(shadowDue(1050, 1000, 10)).toBe(false)
    expect(shadowDue(1100, 1000, 10)).toBe(true)
  })

  it('handles every frame and never', () => {
    expect(shadowDue(1001, 1000, Infinity)).toBe(true)
    expect(shadowDue(9999, 0, 0)).toBe(false)
  })
})

describe('adaptScale', () => {
  it('steps down while frames are late, never below the floor', () => {
    expect(adaptScale({ scale: 1, streak: 0 }, 20, 30)).toEqual({ scale: 0.85, streak: 0 })
    expect(adaptScale({ scale: MIN_SCALE, streak: 3 }, 10, 30)).toEqual({ scale: MIN_SCALE, streak: 0 })
  })

  it('holds when close or already sharp', () => {
    expect(adaptScale({ scale: 0.85, streak: 2 }, 28, 30)).toEqual({ scale: 0.85, streak: 0 })
    expect(adaptScale({ scale: 1, streak: 0 }, 30, 30)).toEqual({ scale: 1, streak: 0 })
  })

  it('recovers only after a run of on-time windows', () => {
    let state = { scale: 0.85, streak: 0 }
    for (let i = 1; i < RECOVERY_WINDOWS; i++) {
      state = adaptScale(state, 30, 30)
      expect(state).toEqual({ scale: 0.85, streak: i })
    }
    expect(adaptScale(state, 30, 30)).toEqual({ scale: 0.9, streak: 0 })
  })
})

describe('moved', () => {
  it('ignores settled damping and catches real motion', () => {
    const before = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 8, 12, 1]
    expect(moved(before, before.map((v, i) => (i === 12 ? v + 1e-6 : v)))).toBe(false)
    expect(moved(before, before.map((v, i) => (i === 12 ? v + 0.01 : v)))).toBe(true)
  })
})
