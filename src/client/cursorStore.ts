export const CURSOR_KEY = 'pullbureau:lastPlayedAt'
export const PLAYED_KEY = 'pullbureau:playedEvents'

export type CursorStore = { read(): string | null; write(cursor: string): void }

export function createMemoryCursorStore(): CursorStore {
  let value: string | null = null
  return {
    read: () => value,
    write: cursor => {
      value = cursor
    },
  }
}

export function createLocalCursorStore(storage: () => Storage = () => window.localStorage, key = CURSOR_KEY): CursorStore {
  const memory = createMemoryCursorStore()
  return {
    read() {
      try {
        return storage().getItem(key) ?? memory.read()
      } catch {
        return memory.read()
      }
    },
    write(cursor) {
      memory.write(cursor)
      try {
        storage().setItem(key, cursor)
      } catch {
        // storage blocked (private window, previews): memory is enough
      }
    },
  }
}

export function parsePlayed(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : []
  } catch {
    return []
  }
}
