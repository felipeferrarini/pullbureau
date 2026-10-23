import { describe, expect, it } from 'vitest'
import type { PrRef, SceneEvent } from '@/types/domain'
import { businessDuration, buildHudStrip, isClosedRepo, signed, tickerItems } from './hudStrip'
import { counter, emptyStats, queuedPr, snapshot } from './testFactories'

describe('businessDuration', () => {
  it('shows a dash when there is no data', () => {
    expect(businessDuration(null)).toBeNull()
  })

  it('uses business hours below one business day', () => {
    expect(businessDuration(3.5)).toEqual({ value: '3,5', unit: 'h úteis' })
    expect(businessDuration(1)).toEqual({ value: '1', unit: 'h útil' })
    expect(businessDuration(0.4)).toEqual({ value: '< 1', unit: 'h útil' })
  })

  it('switches to business days of 9 hours', () => {
    expect(businessDuration(9)).toEqual({ value: '1', unit: 'dia útil' })
    expect(businessDuration(10.8)).toEqual({ value: '1,2', unit: 'dia útil' })
    expect(businessDuration(31.5)).toEqual({ value: '3,5', unit: 'dias úteis' })
    expect(businessDuration(180)).toEqual({ value: '20', unit: 'dias úteis' })
  })
})

describe('signed', () => {
  it('prints the sign with a real minus', () => {
    expect(signed(3)).toBe('+3')
    expect(signed(0)).toBe('0')
    expect(signed(-2)).toBe('−2')
  })
})

describe('buildHudStrip', () => {
  const brawl = queuedPr({ number: 3, title: 'briga', discussion: { messages: 12, participants: ['a', 'b'] } })
  const base = snapshot({
    counters: [counter({ queue: [queuedPr({ number: 1 }), brawl] })],
    oldestPr: queuedPr({ repo: 'students', number: 302, createdAt: '2025-12-02T17:29:00Z', ageDays: 317 }),
    stats: {
      ...emptyStats(),
      queueNow: 46,
      queue7dAgo: 40,
      inflow7d: 12,
      outflow7d: 9,
      medianFirstReviewHours30d: 4.2,
      medianMergeHours30d: null,
      unreviewedCount: 5,
      oldestUnreviewed: { repo: 'infra', number: 7 },
      ciRedPct: 45,
    },
  })

  it('derives every metric of the strip', () => {
    expect(buildHudStrip(base)).toEqual({
      queue: { now: 46, before: 40, delta: 6, trend: 'up', tone: 'bad' },
      flow: { inflow: 12, outflow: 9, balance: -3, balanceLabel: '−3', tone: 'bad' },
      firstReview: { value: '4,2', unit: 'h úteis' },
      merge: null,
      unreviewed: { count: 5, target: { repo: 'infra', number: 7 }, tone: 'warn' },
      oldest: { key: { repo: 'students', number: 302 }, date: '02/12/2025', label: 'students #302', ageDays: 317 },
      ciRed: { pct: 45, tone: 'bad' },
      brawls: [{ repo: 'api', number: 3, title: 'briga' }],
    })
  })

  it('reads a shrinking queue and a positive balance as good news', () => {
    const strip = buildHudStrip(snapshot({ stats: { ...emptyStats(), queueNow: 10, queue7dAgo: 14, inflow7d: 3, outflow7d: 3, ciRedPct: 5 } }))
    expect(strip.queue).toEqual({ now: 10, before: 14, delta: -4, trend: 'down', tone: 'good' })
    expect(strip.flow).toMatchObject({ balance: 0, balanceLabel: '0', tone: 'good' })
    expect(strip.ciRed).toEqual({ pct: 5, tone: 'good' })
  })

  it('handles an empty hall', () => {
    const strip = buildHudStrip(snapshot())
    expect(strip.queue.trend).toBe('flat')
    expect(strip.queue.tone).toBe('neutral')
    expect(strip.unreviewed).toEqual({ count: 0, target: null, tone: 'good' })
    expect(strip.oldest).toBeNull()
    expect(strip.ciRed).toEqual({ pct: null, tone: 'neutral' })
    expect(strip.brawls).toEqual([])
  })

  it('grades the red ci share', () => {
    const tone = (ciRedPct: number) => buildHudStrip(snapshot({ stats: { ...emptyStats(), ciRedPct } })).ciRed.tone
    expect([tone(10), tone(11), tone(29), tone(30)]).toEqual(['good', 'warn', 'warn', 'bad'])
  })
})

describe('tickerItems', () => {
  const pr = (repo: string, number: number): PrRef => ({ repo, number, title: 't', url: 'u', author: 'fulano' })

  it('tones each line by what happened, latest first', () => {
    const events: SceneEvent[] = [
      { kind: 'pr_opened', at: '2026-10-15T10:00:00Z', pr: pr('students', 1) },
      { kind: 'ci', at: '2026-10-15T11:00:00Z', pr: pr('students', 1), result: 'failure' },
      { kind: 'review', at: '2026-10-15T12:00:00Z', pr: pr('students', 1), reviewer: 'b', state: 'approved' },
      { kind: 'merged', at: '2026-10-15T13:00:00Z', pr: pr('students', 1), queueJump: true },
      { kind: 'review', at: '2026-10-15T14:00:00Z', pr: pr('students', 1), reviewer: 'c', state: 'changes_requested' },
    ]
    expect(tickerItems(events, 4)).toEqual([
      { text: '@c pediu mudanças em students #1', tone: 'alert' },
      { text: 'FURA-FILA! @fulano passou na frente em students #1', tone: 'alert' },
      { text: '@b aprovou students #1', tone: 'good' },
      { text: 'CI falhou em students #1', tone: 'alert' },
    ])
  })
})

describe('isClosedRepo', () => {
  it('tells whether a repo sits in the closed counters corridor', () => {
    const snap = snapshot({
      counters: [
        counter({ repo: 'students', lastActivityAt: '2026-10-14T12:00:00Z', activity7d: 3 }),
        counter({ repo: 'portal', lastActivityAt: '2026-05-01T12:00:00Z' }),
      ],
    })
    expect(isClosedRepo(snap, 'portal')).toBe(true)
    expect(isClosedRepo(snap, 'students')).toBe(false)
  })
})
