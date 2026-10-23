// Prototype: explore how filtering appears in the 3D scene.
import { useMemo } from 'react'
import type { Counter, Snapshot } from '@/types/domain'
import type { Actor } from '@/types/scene'
import { type Filter, isActive, matches } from './filter'
import { type Variant, useFilterStore } from './filterStore'

// B: non-matching PRs leave the scene and counters with no match close. Kept counters are marked active so
// an old matching PR isn't hidden in the closed corridor.
function onlyMatching(snapshot: Snapshot, filter: Filter): Snapshot {
  const counters = snapshot.counters
    .map((counter): Counter => ({ ...counter, queue: counter.queue.filter(pr => matches(pr, filter)), lastActivityAt: snapshot.generatedAt }))
    .filter(counter => counter.queue.length > 0)
  return { ...snapshot, counters, waitingRoom: snapshot.waitingRoom.filter(pr => matches(pr, filter)) }
}

// C: everyone stays, but matching PRs walk to the front of their own queue.
function matchingFirst(snapshot: Snapshot, filter: Filter): Snapshot {
  const counters = snapshot.counters.map(counter => {
    const hits = counter.queue.filter(pr => matches(pr, filter))
    return { ...counter, queue: [...hits, ...counter.queue.filter(pr => !hits.includes(pr))] }
  })
  return { ...snapshot, counters }
}

export function shape(snapshot: Snapshot, variant: Variant, filter: Filter): Snapshot {
  if (!isActive(filter)) return snapshot
  if (variant === 'B') return onlyMatching(snapshot, filter)
  if (variant === 'C') return matchingFirst(snapshot, filter)
  return snapshot
}

export function useFilteredSnapshot(snapshot: Snapshot): Snapshot {
  const variant = useFilterStore(state => state.variant)
  const filter = useFilterStore(state => state.filter)
  return useMemo(() => shape(snapshot, variant, filter), [snapshot, variant, filter])
}

export type ActorLook = { ghost: boolean; lit: boolean }
const PLAIN: ActorLook = { ghost: false, lit: false }

// A ghosts the PRs that don't match; C outlines the ones that do. Attendants are never touched.
export function useActorLook(): (actor: Actor) => ActorLook {
  const variant = useFilterStore(state => state.variant)
  const filter = useFilterStore(state => state.filter)
  return (actor: Actor) => {
    if (!isActive(filter) || variant === 'B' || !actor.pr || actor.kind === 'attendant') return PLAIN
    const hit = matches(actor.pr, filter)
    return variant === 'A' ? { ghost: !hit, lit: false } : { ghost: false, lit: hit }
  }
}
