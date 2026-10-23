'use client'

import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/client/store'
import { noDeployNow } from '@/eggs/eggClock'
import { alarmFor } from '@/eggs/friday'
import { playSound } from '@/sound/sfx'
import type { SceneIndex, StartedPlan } from '@/types/scene'
import { isIntroPlaying } from '../walkIn/introStore'
import { type DirectorTime, advanceDirector, canStartEvent, dueSounds, planEvent, pruneFinished } from './plan'

const TICK_MS = 250

type DirectorClock = { plans: StartedPlan[]; now: number }

const DirectorContext = createContext<DirectorClock>({ plans: [], now: 0 })

export const useDirectorClock = () => useContext(DirectorContext)

function startQueued(current: StartedPlan[], index: SceneIndex, now: number): StartedPlan[] {
  const store = useAppStore.getState()
  let next = current
  for (let plan = store.takePlan(); plan; plan = store.takePlan()) next = [...next, { ...plan, startedAt: now }]
  for (;;) {
    const event = store.takeEventWhere(candidate => canStartEvent(next, candidate))
    if (!event) break
    const plan = planEvent(event, index)
    if (plan) next = [...next, { ...plan, startedAt: now }]
    const alarm = alarmFor(event, noDeployNow())
    if (alarm) next = [...next, { ...alarm, startedAt: now }]
  }
  return next
}

export function DirectorProvider({ index, children }: { index: SceneIndex; children: ReactNode }) {
  const [clock, setClock] = useState<DirectorClock>({ plans: [], now: 0 })
  const plansRef = useRef<StartedPlan[]>([])
  const indexRef = useRef(index)
  const firedRef = useRef(new Set<string>())
  const timeRef = useRef<DirectorTime | null>(null)

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    const timer = setInterval(() => {
      const real = performance.now()
      timeRef.current = advanceDirector(timeRef.current ?? { real, virtual: real }, real)
      const now = timeRef.current.virtual
      const previous = plansRef.current
      const live = pruneFinished(previous, now)
      const next = isIntroPlaying() ? live : startQueued(live, indexRef.current, now)
      const soundOn = useAppStore.getState().soundOn
      for (const due of dueSounds(next, now, firedRef.current)) {
        firedRef.current.add(due.key)
        if (soundOn) playSound(due.sound)
      }
      firedRef.current = new Set([...firedRef.current].filter(key => next.some(plan => key.startsWith(`${plan.id}:`))))
      plansRef.current = next
      if (next.length || previous.length) setClock({ plans: next, now })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  return <DirectorContext.Provider value={clock}>{children}</DirectorContext.Provider>
}
