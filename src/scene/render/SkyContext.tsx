'use client'

import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { skyPhase } from '@/eggs/clock'
import type { Sky } from '@/types/eggs'
import type { SkyLook } from '@/types/outside'
import { sceneNow } from '../sceneClock'
import { skyLook } from './skyLook'

const TICK_MS = 30_000
const SUN_STEP = 0.01

const SkyContext = createContext<SkyLook>(skyLook({ phase: 'day', sun: 0.5 }))

const sameSky = (a: Sky, b: Sky) => a.phase === b.phase && Math.abs(a.sun - b.sun) < SUN_STEP

export function SkyProvider({ children }: { children: ReactNode }) {
  const [sky, setSky] = useState(() => skyPhase(sceneNow()))
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = skyPhase(sceneNow())
      setSky(current => (sameSky(current, next) ? current : next))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])
  const look = useMemo(() => skyLook(sky), [sky])
  return <SkyContext.Provider value={look}>{children}</SkyContext.Provider>
}

export const useSkyLook = () => useContext(SkyContext)
