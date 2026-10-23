import { create } from 'zustand'
import type { DataSource } from '@/types/client'
import type { PrKey, SceneEvent, Snapshot } from '@/types/domain'
import type { Notice } from '@/types/hud'
import type { Plan, SceneSpot } from '@/types/scene'

export const MAX_PENDING_EVENTS = 60
export const MAX_NOTICES = 3

export type AppState = {
  source: DataSource | null
  snapshot: Snapshot | null
  error: string | null
  pendingEvents: SceneEvent[]
  skipped: number
  viewerLogin: string | null
  selected: PrKey | null
  focusRepo: string | null
  spot: SceneSpot | null
  following: PrKey | null
  duel: PrKey | null
  soundOn: boolean
  showClosed: boolean
  pendingPlans: Plan[]
  replay: string | null
  notices: Notice[]
  setReplay: (name: string | null) => void
  pushNotice: (notice: Notice) => void
  dropNotice: (id: string) => void
  setSource: (source: DataSource) => void
  receive: (snapshot: Snapshot, events: SceneEvent[], skipped: number) => void
  setError: (error: string | null) => void
  takeEventWhere: (accept: (event: SceneEvent) => boolean) => SceneEvent | undefined
  setViewer: (login: string | null) => void
  select: (key: PrKey | null) => void
  focus: (repo: string | null) => void
  focusSpot: (spot: SceneSpot | null) => void
  follow: (key: PrKey | null) => void
  openDuel: (key: PrKey) => void
  closeDuel: () => void
  toggleSound: () => void
  setShowClosed: (show: boolean) => void
  enqueuePlan: (plan: Plan) => void
  takePlan: () => Plan | undefined
}

export const useAppStore = create<AppState>((set, get) => ({
  source: null,
  snapshot: null,
  error: null,
  pendingEvents: [],
  skipped: 0,
  viewerLogin: null,
  selected: null,
  focusRepo: null,
  spot: null,
  following: null,
  duel: null,
  soundOn: false,
  showClosed: false,
  pendingPlans: [],
  replay: null,
  notices: [],
  setReplay: replay => set({ replay }),
  pushNotice: notice => set(state => ({ notices: [notice, ...state.notices.filter(other => other.id !== notice.id)].slice(0, MAX_NOTICES) })),
  dropNotice: id => set(state => ({ notices: state.notices.filter(notice => notice.id !== id) })),
  setSource: source => set({ source }),
  receive: (snapshot, events, skipped) =>
    set(state => ({ snapshot, error: null, skipped, pendingEvents: [...state.pendingEvents, ...events].slice(-MAX_PENDING_EVENTS) })),
  setError: error => set({ error }),
  takeEventWhere: accept => {
    const events = get().pendingEvents
    const index = events.findIndex(accept)
    if (index < 0) return undefined
    set({ pendingEvents: events.filter((_, i) => i !== index) })
    return events[index]
  },
  setViewer: viewerLogin => set({ viewerLogin }),
  select: selected => set({ selected }),
  focus: focusRepo => set({ focusRepo, spot: null, following: null }),
  focusSpot: spot => set({ spot, focusRepo: null, following: null }),
  follow: following => set({ following }),
  openDuel: duel => set({ duel, selected: null }),
  closeDuel: () => set({ duel: null }),
  toggleSound: () => set(state => ({ soundOn: !state.soundOn })),
  setShowClosed: showClosed => set(state => ({ showClosed, focusRepo: showClosed ? state.focusRepo : null })),
  enqueuePlan: plan => set(state => ({ pendingPlans: [...state.pendingPlans, plan] })),
  takePlan: () => {
    const [next, ...rest] = get().pendingPlans
    if (next) set({ pendingPlans: rest })
    return next
  },
}))

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') Object.assign(window, { __pullbureauStore: useAppStore })
