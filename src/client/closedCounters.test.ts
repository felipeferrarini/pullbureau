import { describe, expect, it } from 'vitest'
import { readShowClosed, writeShowClosed } from './closedCounters'
import { createLocalCursorStore, createMemoryCursorStore } from './cursorStore'

describe('closed counters preference', () => {
  it('defaults to hidden and remembers the choice', () => {
    const store = createMemoryCursorStore()
    expect(readShowClosed(store)).toBe(false)
    writeShowClosed(store, true)
    expect(readShowClosed(store)).toBe(true)
    writeShowClosed(store, false)
    expect(readShowClosed(store)).toBe(false)
  })

  it('survives a storage that throws', () => {
    const store = createLocalCursorStore(() => {
      throw new Error('blocked')
    }, 'k')
    writeShowClosed(store, true)
    expect(readShowClosed(store)).toBe(true)
  })
})
