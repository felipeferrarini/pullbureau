import { create } from 'zustand'
import type { BirthdayGuest } from '@/types/eggs'

export const DISCO_MS = 15_000

type EggState = {
  discoUntil: number | null
  alarm: boolean
  forcedFriday: boolean
  forcedCoffee: boolean
  dogShowOff: number
  standIn: BirthdayGuest | null
  startDisco: (now: number) => void
  stopDisco: () => void
  setAlarm: (alarm: boolean) => void
  forceFriday: () => void
  forceCoffee: () => void
  showOffDog: () => void
  setStandIn: (guest: BirthdayGuest) => void
}

export const useEggStore = create<EggState>(set => ({
  discoUntil: null,
  alarm: false,
  forcedFriday: false,
  forcedCoffee: false,
  dogShowOff: 0,
  standIn: null,
  startDisco: now => set({ discoUntil: now + DISCO_MS }),
  stopDisco: () => set({ discoUntil: null }),
  setAlarm: alarm => set({ alarm }),
  forceFriday: () => set({ forcedFriday: true }),
  forceCoffee: () => set({ forcedCoffee: true }),
  showOffDog: () => set(state => ({ dogShowOff: state.dogShowOff + 1 })),
  setStandIn: standIn => set({ standIn }),
}))

export const isDiscoOn = (state: Pick<EggState, 'discoUntil'>) => state.discoUntil !== null

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') Object.assign(window, { __pullbureauEggs: useEggStore })
