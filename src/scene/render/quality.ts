'use client'

import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createLocalCursorStore } from '@/client/cursorStore'
import type { Quality, QualityProfile, ViewportSize } from '@/types/scene'
import { QUALITY_PROFILES, chooseQuality, parseQuality, pixelRatio } from './qualityTiers'

export const QUALITY_KEY = 'pullbureau:quality'

const preference = () => createLocalCursorStore(undefined, QUALITY_KEY)
const param = (name: string) => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(name))

export function forcedQuality(): Quality | null {
  return parseQuality(param('fx'))
}

// ?shot=1 keeps the drawing buffer so canvas.toDataURL() works at any time (screenshots only: it costs a copy per frame).
export function keepsDrawingBuffer(): boolean {
  return param('shot') === '1'
}

type QualityState = { quality: Quality; scale: number; setQuality: (quality: Quality) => void; setScale: (scale: number) => void }

export const useQualityStore = create<QualityState>(set => ({
  quality: typeof window === 'undefined' ? chooseQuality(null, null) : chooseQuality(param('fx'), preference().read()),
  scale: 1,
  setQuality: quality => {
    preference().write(quality)
    set({ quality, scale: 1 })
  },
  setScale: scale => set({ scale }),
}))

export const useQuality = () => useQualityStore(state => state.quality)
export const useQualityProfile = (): QualityProfile => QUALITY_PROFILES[useQuality()]

// ?fx=low (Economy) is the floor for weak GPUs and the software renderer of the e2e: no shadows, no post-processing, no far scenery.
export const useLiteScene = () => useQuality() === 'low'

let viewportKey = ''
let viewport: ViewportSize = { width: 1, height: 1, devicePixelRatio: 1 }

function readViewport(): ViewportSize {
  const key = `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`
  if (key !== viewportKey) {
    viewportKey = key
    viewport = { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio || 1 }
  }
  return viewport
}

function subscribeViewport(onChange: () => void) {
  let media: MediaQueryList | null = null
  const watchRatio = () => {
    media?.removeEventListener('change', onRatio)
    media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    media.addEventListener('change', onRatio)
  }
  const onRatio = () => {
    watchRatio()
    onChange()
  }
  watchRatio()
  window.addEventListener('resize', onChange)
  return () => {
    window.removeEventListener('resize', onChange)
    media?.removeEventListener('change', onRatio)
  }
}

const serverViewport = () => viewport

// Canvas pixel ratio for the chosen tier, the window size and the current load.
export function usePixelRatio(): number {
  const profile = useQualityProfile()
  const scale = useQualityStore(state => state.scale)
  const size = useSyncExternalStore(subscribeViewport, readViewport, serverViewport)
  return pixelRatio(size, profile, scale)
}
