import type { DataSource } from '@/types/client'
import type { PrThread, Snapshot } from '@/types/domain'

export const POLL_INTERVAL_MS = 60_000

export class SourceError extends Error {
  override name = 'SourceError'
  constructor(readonly status: number) {
    super(`request failed with ${status}`)
  }
}

async function getJson<T>(fetchImpl: typeof fetch, url: string): Promise<T> {
  const response = await fetchImpl(url, { cache: 'no-store' })
  if (!response.ok) throw new SourceError(response.status)
  return (await response.json()) as T
}

export function createLiveSource(fetchImpl: typeof fetch = fetch, intervalMs = POLL_INTERVAL_MS): DataSource {
  return {
    now: () => new Date(),
    start(onSnapshot, onError) {
      let stopped = false
      const tick = async () => {
        try {
          const snapshot = await getJson<Snapshot>(fetchImpl, '/api/state')
          if (!stopped) onSnapshot(snapshot)
        } catch (error) {
          if (!stopped) onError?.(error)
        }
      }
      void tick()
      const timer = setInterval(tick, intervalMs)
      return () => {
        stopped = true
        clearInterval(timer)
      }
    },
    async getThread(repo, number) {
      try {
        return await getJson<PrThread>(fetchImpl, `/api/pr/${encodeURIComponent(repo)}/${number}`)
      } catch (error) {
        if (error instanceof SourceError && error.status === 404) return null
        throw error
      }
    },
  }
}
