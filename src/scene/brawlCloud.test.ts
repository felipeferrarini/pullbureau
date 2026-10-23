import { describe, expect, it } from 'vitest'
import { BRAWL_FPS, BRAWL_FRAMES, REDUCED_FRAME_S, brawlFrameAt, brawlFrames } from './brawlCloud'

describe('brawlFrames', () => {
  const frames = brawlFrames(412)

  it('loops a few frames of fists, feet, stars and lettering', () => {
    expect(frames).toHaveLength(BRAWL_FRAMES)
    for (const frame of frames) {
      expect(frame.limbs.length).toBeGreaterThanOrEqual(2)
      expect(frame.stars.length).toBeGreaterThanOrEqual(3)
      expect(frame.word.text.length).toBeGreaterThan(0)
    }
    expect(new Set(frames.flatMap(frame => frame.limbs.map(limb => limb.kind)))).toEqual(new Set(['fist', 'foot']))
  })

  it('shows the PR number every few frames between the sound effects', () => {
    const words = frames.map(frame => frame.word.text)
    expect(words.filter(word => word === '#412').length).toBeGreaterThanOrEqual(2)
    expect(words.some(word => word === 'POW!')).toBe(true)
    words.forEach((word, i) => expect(word).not.toBe(words[(i + 1) % words.length]))
  })

  it('keeps every star and word inside the frame', () => {
    for (const { stars, word } of frames) {
      for (const { x, y } of [...stars, word]) {
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(1)
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(1)
      }
    }
  })

  it('is the same for the same PR', () => {
    expect(brawlFrames(412)).toEqual(frames)
  })
})

describe('brawlFrameAt', () => {
  it('flips frames quickly and loops', () => {
    expect(brawlFrameAt(0, false)).toBe(0)
    expect(brawlFrameAt(1 / BRAWL_FPS + 0.001, false)).toBe(1)
    expect(brawlFrameAt(BRAWL_FRAMES / BRAWL_FPS + 0.001, false)).toBe(0)
  })

  it('barely moves with reduced motion', () => {
    expect(brawlFrameAt(1, true)).toBe(0)
    expect(brawlFrameAt(REDUCED_FRAME_S + 0.01, true)).toBe(1)
  })
})
