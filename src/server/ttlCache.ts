export type Cached<T> = { value: T; stale: boolean }

export function createTtlCache<T>(ttlMs: number, clock: () => number = Date.now) {
  let entry: { value: T; at: number } | null = null
  let inflight: Promise<Cached<T>> | null = null

  return function get(loader: () => Promise<T>): Promise<Cached<T>> {
    if (entry && clock() - entry.at < ttlMs) return Promise.resolve({ value: entry.value, stale: false })
    inflight ??= loader()
      .then(value => {
        entry = { value, at: clock() }
        return { value, stale: false }
      })
      .catch(error => {
        if (entry) return { value: entry.value, stale: true }
        throw error
      })
      .finally(() => {
        inflight = null
      })
    return inflight
  }
}
