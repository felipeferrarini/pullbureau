import { describe, expect, it } from 'vitest'
import { CHARACTER_BY_ID } from '@/shared/characters'
import { CHAIR_SEAT, PULL_S, STOOL_COLORS, chairLift, nextStoolPhase, seatFor, seatOf, sitsDown, stoolColor, stoolPose, wantsStool } from './seat'

describe('seatFor', () => {
  it('puts the seat under the hips of the SitDown last frame (measured on the skinned basecharacter)', () => {
    const seat = seatFor(3.147)
    expect(seat.height).toBeCloseTo(0.261, 2)
    expect(seat.back).toBeCloseTo(0.24, 2)
  })

  it('scales with the model, since every character is fitted to the same height', () => {
    expect(seatFor(4.292).height).toBeCloseTo(0.191, 2)
    expect(seatFor(3.204).height).toBeLessThan(seatFor(3.147).height)
  })

  it('reads the height from the manifest', () => {
    const entry = CHARACTER_BY_ID.get('casual-male')
    expect(entry).toBeDefined()
    expect(seatOf('casual-male')).toEqual(seatFor(entry?.height ?? 0))
    expect(seatOf('nobody').height).toBeGreaterThan(0.2)
  })
})

describe('chairLift', () => {
  it('raises a sitter onto the waiting chair cushion, never below the floor', () => {
    expect(seatFor(3.147).height + chairLift(seatFor(3.147))).toBeCloseTo(CHAIR_SEAT)
    expect(chairLift({ height: 0.6, back: 0.2 })).toBe(0)
  })
})

describe('wantsStool', () => {
  it('gives a stool to queue customers who sit, not to the waiting room or attendants', () => {
    expect(wantsStool({ kind: 'customer', anim: 'sit' })).toBe(true)
    expect(wantsStool({ kind: 'customer', anim: 'idle' })).toBe(false)
    expect(wantsStool({ kind: 'waiting', anim: 'sit' })).toBe(false)
    expect(wantsStool({ kind: 'attendant', anim: 'sit' })).toBe(false)
  })
})

describe('stool phases', () => {
  it('has the stool already in place for someone seated at load', () => {
    const phase = nextStoolPhase(null, true, 10)
    expect(stoolPose(phase, 10)).toEqual({ slide: 0, scale: 1 })
    expect(sitsDown(phase, 10)).toBe(true)
  })

  it('pulls the stool in from behind before sitting down', () => {
    const standing = nextStoolPhase(null, false, 0)
    expect(stoolPose(standing, 0).scale).toBe(0)
    const pulling = nextStoolPhase(standing, true, 5)
    expect(stoolPose(pulling, 5).slide).toBe(1)
    expect(sitsDown(pulling, 5 + PULL_S / 2)).toBe(false)
    expect(stoolPose(pulling, 5 + PULL_S / 2).slide).toBeGreaterThan(0)
    expect(stoolPose(pulling, 5 + PULL_S)).toEqual({ slide: 0, scale: 1 })
    expect(sitsDown(pulling, 5 + PULL_S)).toBe(true)
  })

  it('folds the stool away when the sitter gets up', () => {
    const seated = nextStoolPhase(null, true, 0)
    expect(nextStoolPhase(seated, true, 3)).toBe(seated)
    const up = nextStoolPhase(seated, false, 3)
    expect(stoolPose(up, 3).scale).toBe(1)
    expect(stoolPose(up, 4).scale).toBe(0)
  })
})

describe('stoolColor', () => {
  it('picks a stable colour from the palette per sitter', () => {
    expect(stoolColor('pr:a#1')).toBe(stoolColor('pr:a#1'))
    expect(STOOL_COLORS).toContain(stoolColor('pr:b#2'))
    expect(new Set(Array.from({ length: 30 }, (_, i) => stoolColor(`pr:x#${i}`))).size).toBeGreaterThan(3)
  })
})
