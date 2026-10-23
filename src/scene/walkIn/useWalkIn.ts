'use client'

import { useLayoutEffect } from 'react'
import { hashString } from '@/shared/hash'
import type { Rect } from '@/types/outside'
import type { Actor, Vec3 } from '@/types/scene'
import { introPlan, shouldPlayIntro } from '../intro'
import { introTotal, scheduleRoutes } from './introTimeline'
import { useIntroStore } from './introStore'

let decided = false

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Runs once per page load: the first snapshot walks everyone in from the sidewalk.
export function useWalkIn(actors: Actor[], seed: string, footprint: Rect) {
  useLayoutEffect(() => {
    if (decided) return
    decided = true
    const params = new URLSearchParams(window.location.search)
    if (!shouldPlayIntro({ isFirstSnapshot: true, params }) || prefersReducedMotion()) return useIntroStore.getState().settle()
    const targets = new Map<string, Vec3>(actors.map(actor => [actor.id, actor.position]))
    const routes = scheduleRoutes(introPlan(actors, targets, hashString(seed), footprint))
    useIntroStore.getState().start(routes, introTotal(routes), performance.now())
  }, [actors, seed, footprint])
}
