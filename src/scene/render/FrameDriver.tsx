'use client'

import { advance, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Matrix4 } from 'three'
import type { Material, Mesh } from 'three'
import type { FrameSignals, ScaleState } from '@/types/scene'
import { MOTION_HOLD_MS, adaptScale, frameDue, moved, shadowDue, targetFps } from './frameScheduler'
import { useLiteScene, useQualityProfile, useQualityStore } from './quality'

const WINDOW_MS = 2000
// Shader compiles right after a (re)start would read as load; give them a moment.
const WARMUP_MS = 3000
const INPUTS = ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart'] as const

function useInputSignals() {
  const signals = useRef<Omit<FrameSignals, 'now'>>({ lastInputAt: 0, motionUntil: 0, dragging: false })
  useEffect(() => {
    const state = signals.current
    state.lastInputAt = performance.now()
    const touched = () => void (state.lastInputAt = performance.now())
    const press = () => void (state.dragging = true)
    const release = () => void (state.dragging = false)
    for (const name of INPUTS) window.addEventListener(name, touched, { passive: true })
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      for (const name of INPUTS) window.removeEventListener(name, touched)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [])
  return signals
}

// Materials keep their shadow code until recompiled, so switching shadows on or off needs a refresh.
function useMaterialRefresh() {
  const get = useThree(state => state.get)
  const lite = useLiteScene()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    get().scene.traverse(object => {
      const material = (object as Mesh).material as Material | Material[] | undefined
      for (const each of Array.isArray(material) ? material : material ? [material] : []) each.needsUpdate = true
    })
  }, [lite, get])
}

// Renders on its own clock (Canvas frameloop="never"): the tier rate by default, full rate while the camera moves, slower when idle.
export function FrameDriver({ paused }: { paused: boolean }) {
  const get = useThree(state => state.get)
  const profile = useQualityProfile()
  const setScale = useQualityStore(state => state.setScale)
  const signals = useInputSignals()
  const origin = useRef<number | null>(null)
  useMaterialRefresh()

  useEffect(() => {
    if (paused) return
    const input = signals.current
    const camera = new Matrix4()
    let lastFrame = -Infinity
    let lastShadow = -Infinity
    const startedAt = performance.now()
    let windowStart = startedAt
    let windowFrames = 0
    let windowFps = 0
    let scaleState: ScaleState = { scale: useQualityStore.getState().scale, streak: 0 }
    let handle = 0

    const measure = (now: number, fps: number) => {
      if (!profile.adaptive) return
      if (fps !== windowFps || now - startedAt < WARMUP_MS) {
        windowFps = fps
        windowStart = now
        windowFrames = 0
        return
      }
      windowFrames++
      if (now - windowStart < WINDOW_MS) return
      const next = adaptScale(scaleState, (windowFrames * 1000) / (now - windowStart), fps)
      if (next.scale !== scaleState.scale) setScale(next.scale)
      scaleState = next
      windowStart = now
      windowFrames = 0
    }

    const tick = (now: number) => {
      handle = requestAnimationFrame(tick)
      const fps = targetFps({ now, ...input }, profile.fps)
      if (!frameDue(now, lastFrame, fps)) return
      lastFrame = now
      const state = get()
      state.gl.shadowMap.autoUpdate = false
      if (shadowDue(now, lastShadow, profile.shadowHz)) {
        state.gl.shadowMap.needsUpdate = true
        lastShadow = now
      }
      origin.current ??= now - 1000 / fps
      advance((now - origin.current) / 1000)
      if (moved(camera.elements, state.camera.matrixWorld.elements)) {
        camera.copy(state.camera.matrixWorld)
        input.motionUntil = now + MOTION_HOLD_MS
      }
      measure(now, fps)
    }
    handle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle)
  }, [paused, profile, get, setScale, signals])

  return null
}
