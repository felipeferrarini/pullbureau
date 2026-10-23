import { describe, expect, it } from 'vitest'
import { KONAMI_CODE, createKonamiMatcher } from './konami'

const feedAll = (keys: string[]) => {
  const feed = createKonamiMatcher()
  return keys.map(feed)
}

describe('createKonamiMatcher', () => {
  it('fires once the whole code is typed, ignoring case', () => {
    const results = feedAll([...KONAMI_CODE.slice(0, 8), 'B', 'A'])
    expect(results.at(-1)).toBe(true)
    expect(results.slice(0, -1).every(result => !result)).toBe(true)
  })

  it('resets on a wrong key', () => {
    expect(feedAll(['ArrowUp', 'ArrowUp', 'x', ...KONAMI_CODE.slice(2)]).at(-1)).toBe(false)
  })

  it('restarts the match when the wrong key is the first key of the code', () => {
    expect(feedAll(['ArrowUp', 'ArrowDown', ...KONAMI_CODE]).at(-1)).toBe(true)
    expect(feedAll(['ArrowUp', ...KONAMI_CODE]).at(-1)).toBe(true)
  })

  it('starts over after firing', () => {
    const feed = createKonamiMatcher()
    KONAMI_CODE.forEach(feed)
    expect(feed('a')).toBe(false)
    expect(KONAMI_CODE.map(feed).at(-1)).toBe(true)
  })
})
