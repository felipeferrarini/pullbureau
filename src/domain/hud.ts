import type { PrKey, QueuedPr, Snapshot } from '@/types/domain'

export function findQueued(snapshot: Snapshot, key: PrKey): QueuedPr | null {
  const all = [...snapshot.counters.flatMap(counter => counter.queue), ...snapshot.waitingRoom]
  return all.find(pr => pr.repo === key.repo && pr.number === key.number) ?? null
}
