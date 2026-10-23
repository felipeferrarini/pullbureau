import { create } from 'zustand'
import type { IntroRoute } from '@/types/scene'

export type IntroStatus = 'idle' | 'playing' | 'done'

type IntroState = {
  status: IntroStatus
  startedAt: number
  total: number
  routes: Map<string, IntroRoute>
  settled: boolean
  settle: () => void
  start: (routes: IntroRoute[], total: number, now: number) => void
  finish: () => void
}

export const useIntroStore = create<IntroState>(set => ({
  status: 'idle',
  startedAt: 0,
  total: 0,
  routes: new Map(),
  settled: false,
  settle: () => set({ settled: true }),
  start: (routes, total, now) => set({ settled: true, status: 'playing', startedAt: now, total, routes: new Map(routes.map(route => [route.actorId, route])) }),
  finish: () => set(state => (state.status === 'playing' ? { status: 'done', routes: new Map() } : state)),
}))

export const introElapsed = (now = performance.now()) => (now - useIntroStore.getState().startedAt) / 1000
export const isIntroPlaying = () => useIntroStore.getState().status === 'playing'

type IntroFlags = Pick<IntroState, 'settled' | 'status'>

// True once we know there is no intro, or after it finished: eggs wait for this.
export const isIntroOver = (state: IntroFlags = useIntroStore.getState()) => state.settled && state.status !== 'playing'

export const useIntroOver = () => useIntroStore(isIntroOver)

export function whenIntroOver(run: () => void): () => void {
  if (isIntroOver()) {
    run()
    return () => {}
  }
  const unsubscribe = useIntroStore.subscribe(state => {
    if (!isIntroOver(state)) return
    unsubscribe()
    run()
  })
  return unsubscribe
}
