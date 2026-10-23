'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { splitCounters } from '@/domain/activity'
import type { Snapshot } from '@/types/domain'
import { closedPreferenceStore, readShowClosed, writeShowClosed } from './closedCounters'
import { useAppStore } from './store'

export function useClosedCounters(snapshot: Snapshot) {
  const show = useAppStore(state => state.showClosed)
  const setShowClosed = useAppStore(state => state.setShowClosed)
  const store = useMemo(() => closedPreferenceStore(), [])
  const hidden = useMemo(() => splitCounters(snapshot.counters, new Date(snapshot.generatedAt)).closed.length, [snapshot])

  useEffect(() => {
    setShowClosed(readShowClosed(store))
  }, [store, setShowClosed])

  const toggle = useCallback(() => {
    writeShowClosed(store, !show)
    setShowClosed(!show)
  }, [store, show, setShowClosed])

  return { show, hidden, toggle }
}
