'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/client/store'
import { sceneIndexFor } from '@/scene/actors'
import { planEvent } from '@/scene/director/plan'
import { hallLayout } from '@/scene/useHallLayout'
import { whenIntroOver } from '@/scene/walkIn/introStore'
import type { EggName } from '@/types/eggs'
import { MAX_PARTIES, PARTY_STAGGER_MS, birthdayGuests, planBirthday, standInGuest } from './birthday'
import { urlEggs } from './debugEggs'
import { fakeMerge } from './debugEvents'
import { planFireAlarm } from './friday'
import { useEggStore } from './eggStore'

const SETTLE_MS = 1500

type Trigger = () => void

function playFakeMerge(queueJump: boolean) {
  const { snapshot, showClosed, enqueuePlan } = useAppStore.getState()
  if (!snapshot) return
  const layout = hallLayout(snapshot, showClosed)
  const event = fakeMerge(layout.snapshot, layout.hallCount, queueJump, new Date().toISOString())
  const plan = event && planEvent(event, sceneIndexFor(layout.snapshot, layout.hallCount))
  if (plan) enqueuePlan({ ...plan, id: `egg:${plan.id}` })
}

function replayBirthdays() {
  const { snapshot, showClosed, enqueuePlan } = useAppStore.getState()
  if (!snapshot) return
  const layout = hallLayout(snapshot, showClosed)
  const guests = birthdayGuests(layout.snapshot.counters, layout.hallCount, new Date(snapshot.generatedAt))
  if (guests.length) return guests.slice(0, MAX_PARTIES).forEach((guest, i) => enqueuePlan(planBirthday(guest, new Date().toISOString(), i * PARTY_STAGGER_MS)))
  const standIn = standInGuest(layout.snapshot.counters, layout.hallCount)
  if (standIn) useEggStore.getState().setStandIn(standIn)
}

const TRIGGERS: Partial<Record<EggName, Trigger>> = {
  caramelo: () => useEggStore.getState().showOffDog(),
  furafila: () => playFakeMerge(true),
  aniversario: replayBirthdays,
  baile: () => useEggStore.getState().startDisco(performance.now()),
  cafe: () => useEggStore.getState().forceCoffee(),
  sexta: () => {
    useEggStore.getState().forceFriday()
    playFakeMerge(false)
    useAppStore.getState().enqueuePlan(planFireAlarm(new Date().toISOString()))
  },
}

// Debug triggers: `?egg=caramelo|furafila|aniversario|sexta|baile|cafe`, played once the intro is over.
export function useEggTriggers(extra: Partial<Record<EggName, Trigger>> = {}) {
  useEffect(() => {
    const eggs = urlEggs()
    if (!eggs.size) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const stop = whenIntroOver(() => {
      timer = setTimeout(() => eggs.forEach(egg => (extra[egg] ?? TRIGGERS[egg])?.()), SETTLE_MS)
    })
    return () => {
      stop()
      clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
