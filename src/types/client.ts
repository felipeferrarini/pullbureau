import type { PrThread, Snapshot } from './domain'

export type SourceErrorHandler = (error: unknown) => void

export interface DataSource {
  now(): Date
  start(onSnapshot: (snapshot: Snapshot) => void, onError?: SourceErrorHandler): () => void
  getThread(repo: string, number: number): Promise<PrThread | null>
}
