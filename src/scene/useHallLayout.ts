'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/client/store'
import { splitCounters } from '@/domain/activity'
import type { Snapshot } from '@/types/domain'
import type { HallLayout } from '@/types/scene'
import { arrangeCounters } from './layout'
import { queueLanes } from './queueLanes'

export function hallLayout(snapshot: Snapshot, showClosed: boolean): HallLayout {
  const split = splitCounters(snapshot.counters, new Date(snapshot.generatedAt))
  const arranged = arrangeCounters(split, showClosed)
  const lanes = queueLanes(arranged.counters.map(counter => counter.queue.length), arranged.hallCount, arranged.closedCount)
  return { ...arranged, snapshot: { ...snapshot, counters: arranged.counters }, hiddenCount: split.closed.length, lanes }
}

export function useHallLayout(snapshot: Snapshot): HallLayout {
  const showClosed = useAppStore(state => state.showClosed)
  return useMemo(() => hallLayout(snapshot, showClosed), [snapshot, showClosed])
}
