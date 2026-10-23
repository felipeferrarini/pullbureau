'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/client/store'
import { sceneIndexFor } from '@/scene/actors'
import { hallLayout } from '@/scene/useHallLayout'
import { isIntroOver, whenIntroOver } from '@/scene/walkIn/introStore'
import { HELI_TOUCHDOWN_MS } from './helicopter'
import { FORCED_INSPECTION_DELAY_MS, HELI_NOTICE, INSPECTION_EVERY_MS, INSPECTION_RETRY_MS, inspectionBlocked, planInspection } from './inspection'

const NOTICE_MS = 3 * 60_000

// The inspector lands every 5 minutes once the intro is over, waiting out a duel or a visit still going on.
export function useInspection() {
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const later = (run: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer)
        run()
      }, delay)
      timers.add(timer)
    }
    let inspectingUntil = 0
    const attempt = () => {
      const { snapshot, showClosed, duel, enqueuePlan, pushNotice, dropNotice } = useAppStore.getState()
      const now = performance.now()
      if (!snapshot) return later(attempt, INSPECTION_RETRY_MS)
      if (!snapshot.meta.ctoLogin) return
      if (inspectionBlocked({ introOver: isIntroOver(), duel: duel !== null, inspectingUntil, now })) return later(attempt, INSPECTION_RETRY_MS)
      const layout = hallLayout(snapshot, showClosed)
      const plan = planInspection(layout.snapshot, sceneIndexFor(layout.snapshot, layout.hallCount), snapshot.meta.ctoLogin, String(Date.now()))
      enqueuePlan(plan)
      inspectingUntil = now + plan.duration
      later(() => pushNotice({ id: plan.id, text: HELI_NOTICE, tone: 'alert' }), HELI_TOUCHDOWN_MS)
      later(() => dropNotice(plan.id), HELI_TOUCHDOWN_MS + NOTICE_MS)
      later(attempt, plan.duration + INSPECTION_EVERY_MS)
    }
    const forced = new URLSearchParams(window.location.search).get('fiscalizacao') === '1'
    const stopWaiting = whenIntroOver(() => later(attempt, forced ? FORCED_INSPECTION_DELAY_MS : INSPECTION_EVERY_MS))
    return () => {
      stopWaiting()
      timers.forEach(clearTimeout)
    }
  }, [])
}
