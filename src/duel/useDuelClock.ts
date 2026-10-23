'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { DuelScript } from '@/types/duel'
import { HIT_STOP_MS, impactTimes } from './timeline'

const MAX_STEP_MS = 2000

export type DuelClock = { elapsed: number; hitStop: boolean }
type Control = { seek: (ms: number) => void; pause: () => void; play: () => void }

// Script time runs with the wall clock, except for a short freeze (hit-stop) on every impact.
export function useDuelClock(script: DuelScript, run: number): DuelClock {
  const [clock, setClock] = useState<DuelClock>({ elapsed: 0, hitStop: false })
  const impacts = useMemo(() => impactTimes(script), [script])
  const control = useRef<Control | null>(null)

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let logical = 0
    let freezeUntil = 0
    let paused = false
    const tick = (now: number) => {
      const step = paused ? 0 : Math.min(MAX_STEP_MS, now - last)
      last = now
      if (now >= freezeUntil && step > 0) {
        const next = logical + step
        const crossed = impacts.find(at => at > logical && at <= next)
        logical = crossed ?? next
        if (crossed !== undefined) freezeUntil = now + HIT_STOP_MS
      }
      setClock({ elapsed: logical, hitStop: now < freezeUntil })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    control.current = {
      seek: ms => {
        logical = ms
        freezeUntil = 0
      },
      pause: () => {
        paused = true
      },
      play: () => {
        paused = false
      },
    }
    return () => cancelAnimationFrame(frame)
  }, [impacts, run])

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    Object.assign(window, { __pullbureauDuel: { seek: (ms: number) => control.current?.seek(ms), pause: () => control.current?.pause(), play: () => control.current?.play() } })
  }, [])

  return clock
}
