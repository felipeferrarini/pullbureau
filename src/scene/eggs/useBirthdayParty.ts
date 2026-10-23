'use client'

import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/client/store'
import { MAX_PARTIES, PARTY_STAGGER_MS, birthdayGuests, planBirthday } from '@/eggs/birthday'
import { useEggStore } from '@/eggs/eggStore'
import type { Snapshot } from '@/types/domain'

const celebrated = new Set<string>()
let partyLoad = false

// Hats and cakes for today's birthdays (and the debug stand-in); the parties play once, on the first snapshot.
export function useBirthdayParty(snapshot: Snapshot, hallCount: number): Map<string, number> {
  const standIn = useEggStore(state => state.standIn)
  const guests = useMemo(() => {
    const today = birthdayGuests(snapshot.counters, hallCount, new Date(snapshot.generatedAt))
    return standIn && !today.some(guest => guest.actorId === standIn.actorId) ? [...today, standIn] : today
  }, [snapshot, hallCount, standIn])

  useEffect(() => {
    const fresh = guests.filter(guest => !celebrated.has(guest.actorId) && (!partyLoad || guest.actorId === standIn?.actorId))
    partyLoad = true
    fresh.slice(0, MAX_PARTIES).forEach((guest, i) => {
      celebrated.add(guest.actorId)
      useAppStore.getState().enqueuePlan(planBirthday(guest, snapshot.generatedAt, i * PARTY_STAGGER_MS))
    })
  }, [guests, snapshot.generatedAt, standIn])

  return useMemo(() => new Map(guests.map(guest => [guest.actorId, guest.months])), [guests])
}
