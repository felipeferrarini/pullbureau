'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/client/store'
import { planStrikeEnd, strikeEnded } from './strike'

export function useStrikeWatcher() {
  useEffect(
    () =>
      useAppStore.subscribe((state, previous) => {
        if (!state.snapshot || !previous.snapshot || state.snapshot === previous.snapshot) return
        if (strikeEnded(previous.snapshot.strike.active, state.snapshot.strike.active)) state.enqueuePlan(planStrikeEnd(state.snapshot.generatedAt))
      }),
    [],
  )
}
