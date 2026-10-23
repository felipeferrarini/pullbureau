import { describe, expect, it } from 'vitest'
import { MIN_DPR, QUALITY_PROFILES, chooseQuality, parseQuality, pixelRatio } from './qualityTiers'

const normal = QUALITY_PROFILES.normal
const megapixels = (width: number, height: number, ratio: number) => (width * ratio * height * ratio) / 1e6

describe('parseQuality', () => {
  it('accepts the three tiers and nothing else', () => {
    expect(parseQuality('low')).toBe('low')
    expect(parseQuality('normal')).toBe('normal')
    expect(parseQuality('high')).toBe('high')
    expect(parseQuality('ultra')).toBeNull()
    expect(parseQuality(null)).toBeNull()
  })
})

describe('chooseQuality', () => {
  it('prefers the URL, then the saved choice, then normal', () => {
    expect(chooseQuality('low', 'high')).toBe('low')
    expect(chooseQuality(null, 'high')).toBe('high')
    expect(chooseQuality('bogus', 'junk')).toBe('normal')
    expect(chooseQuality(null, null)).toBe('normal')
  })
})

describe('pixelRatio', () => {
  it('caps a retina laptop at 1.5', () => {
    expect(pixelRatio({ width: 1440, height: 900, devicePixelRatio: 2 }, normal)).toBe(1.5)
  })

  it('keeps big monitors inside the pixel budget', () => {
    const wide = pixelRatio({ width: 3440, height: 1440, devicePixelRatio: 1 }, normal)
    expect(wide).toBeLessThan(1)
    expect(megapixels(3440, 1440, wide)).toBeLessThanOrEqual(3.5)
    const qhd = pixelRatio({ width: 2560, height: 1440, devicePixelRatio: 1 }, normal)
    expect(megapixels(2560, 1440, qhd)).toBeLessThanOrEqual(3.5)
  })

  it('never goes above the device ratio', () => {
    expect(pixelRatio({ width: 800, height: 600, devicePixelRatio: 1 }, normal)).toBe(1)
  })

  it('lets the high tier keep today’s retina sharpness', () => {
    expect(pixelRatio({ width: 1440, height: 900, devicePixelRatio: 2 }, QUALITY_PROFILES.high)).toBe(2)
  })

  it('scales down under load, with a floor', () => {
    expect(pixelRatio({ width: 1440, height: 900, devicePixelRatio: 2 }, normal, 0.8)).toBe(1.2)
    expect(pixelRatio({ width: 3840, height: 2160, devicePixelRatio: 2 }, QUALITY_PROFILES.low, 0.1)).toBe(MIN_DPR)
  })
})
