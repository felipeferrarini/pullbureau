import type { HistoryPr, OpenPr, Snapshot } from '@/types/domain'
import { buildBoard } from './board'
import { deriveEvents } from './events'
import { buildPeople } from './people'
import { buildCounters, buildWaitingRoom, findOldest } from './queue'
import { buildStats } from './stats'
import { buildStrike } from './strike'

export type SnapshotInput = {
  open: OpenPr[]
  history: HistoryPr[]
  members: string[]
  now: Date
  modelIds: string[]
  overrides: Record<string, string>
  excluded: string[]
  org: string
  ctoLogin: string
  stale: boolean
}

export function buildSnapshot(input: SnapshotInput): Snapshot {
  const { open, history, members, now } = input
  const counters = buildCounters(open, history, now)
  return {
    generatedAt: now.toISOString(),
    stale: input.stale,
    meta: { org: input.org, ctoLogin: input.ctoLogin },
    counters,
    waitingRoom: buildWaitingRoom(open, now),
    people: buildPeople({ members, open, history, now, modelIds: input.modelIds, overrides: input.overrides, excluded: input.excluded }),
    board: buildBoard(history, members, input.excluded, now),
    strike: buildStrike(history, now),
    oldestPr: findOldest(counters),
    events: deriveEvents(open, history, now),
    stats: buildStats(open, history, now),
  }
}
