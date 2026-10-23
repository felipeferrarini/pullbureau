import type { PrThread, Snapshot } from './domain'

export type ReplayFixture = { snapshots: Snapshot[]; threads: Record<string, PrThread> }

export const threadKey = (repo: string, number: number) => `${repo}#${number}`
