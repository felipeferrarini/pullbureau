import { describe, expect, it } from 'vitest'
import { CURSOR_KEY, createLocalCursorStore, createMemoryCursorStore, parsePlayed } from './cursorStore'

const memoryStorage = () => {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) } as unknown as Storage
}

describe('cursor stores', () => {
  it('persists in localStorage', () => {
    const storage = memoryStorage()
    createLocalCursorStore(() => storage).write('2026-10-15T15:00:00Z')
    expect(storage.getItem(CURSOR_KEY)).toBe('2026-10-15T15:00:00Z')
  })

  it('can persist under another key', () => {
    const storage = memoryStorage()
    createLocalCursorStore(() => storage, 'other').write('v')
    expect(storage.getItem('other')).toBe('v')
    expect(storage.getItem(CURSOR_KEY)).toBeNull()
  })

  it('keeps working in memory when storage throws', () => {
    const store = createLocalCursorStore(() => {
      throw new Error('blocked')
    })
    expect(store.read()).toBeNull()
    store.write('x')
    expect(store.read()).toBe('x')
  })

  it('memory store round-trips', () => {
    const store = createMemoryCursorStore()
    store.write('y')
    expect(store.read()).toBe('y')
  })
})

describe('parsePlayed', () => {
  it('reads a json list of keys and survives garbage', () => {
    expect(parsePlayed('["a","b",3]')).toEqual(['a', 'b'])
    expect(parsePlayed(null)).toEqual([])
    expect(parsePlayed('{nope')).toEqual([])
    expect(parsePlayed('{"a":1}')).toEqual([])
  })
})
