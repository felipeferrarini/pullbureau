import { describe, expect, it } from 'vitest'
import { counter, queuedPr } from '@/domain/testFactories'
import { customerId } from '@/scene/actors'
import { counterX } from '@/scene/layout'
import { SIGN_PAINTS, SLOGANS, STRIKE_END_MS, holdsSign, planStrikeEnd, sloganFor, strikeBanner, strikeBannerText, strikeCast, strikeEnded } from './strike'

const queue = (repo: string, size: number, ageDays = 1) => Array.from({ length: size }, (_, i) => queuedPr({ repo, number: i + 1, ageDays }))

describe('strike egg', () => {
  it('gives each protester a stable slogan', () => {
    expect(sloganFor('pr:api#1')).toBe(sloganFor('pr:api#1'))
    expect(SLOGANS).toContain(sloganFor('pr:x#2'))
  })

  it('detects only the end of a strike', () => {
    expect(strikeEnded(true, false)).toBe(true)
    expect(strikeEnded(false, false)).toBe(false)
    expect(strikeEnded(true, true)).toBe(false)
  })

  it('celebrates the end with a banner', () => {
    const plan = planStrikeEnd('2026-10-15T13:05:00Z')
    expect(plan.duration).toBe(STRIKE_END_MS)
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'banner', text: 'GREVE ENCERRADA' }))
  })

  it('hands a sign to about one in three awake protesters', () => {
    expect([0, 1, 2, 3, 4, 5].map(slot => holdsSign(slot, 1))).toEqual([false, true, false, false, true, false])
    expect(holdsSign(1, 30)).toBe(false)
    expect(holdsSign(1, 90)).toBe(false)
    expect(holdsSign(22, 1)).toBe(false)
  })

  it('paints every sign with a cardboard colour, a phase and a small tilt', () => {
    const cast = strikeCast([counter({ repo: 'a', queue: queue('a', 9) })], 1)
    expect([...cast.signs.keys()]).toEqual([customerId('a', 2), customerId('a', 5)])
    for (const sign of cast.signs.values()) {
      expect(SIGN_PAINTS).toContainEqual(sign.paint)
      expect(Math.abs(sign.tilt)).toBeLessThanOrEqual(0.16)
      expect(sign.phase).toBeGreaterThanOrEqual(0)
    }
  })

  it('ignores the closed corridor', () => {
    const cast = strikeCast([counter({ repo: 'a', queue: queue('a', 3) }), counter({ repo: 'b', queue: queue('b', 3) })], 1)
    expect([...cast.signs.keys()]).toEqual([customerId('a', 2)])
  })

  it('hangs the banner over the two busiest neighbouring counters', () => {
    const counters = [counter({ repo: 'a', queue: queue('a', 1) }), counter({ repo: 'b', queue: queue('b', 5) }), counter({ repo: 'c', queue: queue('c', 4) })]
    const banner = strikeBanner(counters, 3)
    expect(banner?.left[0]).toBeCloseTo(counterX(1, 3) - 1.6)
    expect(banner?.right[0]).toBeCloseTo(counterX(2, 3) + 1.6)
  })

  it('hangs over a single counter when the hall has only one', () => {
    const banner = strikeBanner([counter({ repo: 'a', queue: queue('a', 2) })], 1)
    expect(banner && banner.right[0] - banner.left[0]).toBeCloseTo(3.2)
    expect(strikeBanner([], 0)).toBeNull()
  })

  it('counts the hours without review on the banner', () => {
    const now = new Date('2026-10-16T12:00:00Z')
    expect(strikeBannerText('2026-10-16T01:30:00Z', now)).toBe('GREVE — SEM REVIEW HÁ 10h')
    expect(strikeBannerText('2026-10-12T12:00:00Z', now)).toBe('GREVE — SEM REVIEW HÁ 4 DIAS')
    expect(strikeBannerText(null, now)).toBe('GREVE — NENHUMA REVIEW ATÉ HOJE')
  })
})
