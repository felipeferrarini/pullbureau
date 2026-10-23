import { describe, expect, it } from 'vitest'
import type { PrRef } from '@/types/domain'
import { ALARM_MS, alarmFor, planFireAlarm } from './friday'

const pr: PrRef = { repo: 'r', number: 1, title: 't', url: 'u', author: 'a' }

describe('friday fire alarm', () => {
  it('rings for five seconds with a siren', () => {
    const plan = planFireAlarm('2026-10-16T19:30:00Z')
    expect(plan.duration).toBe(ALARM_MS)
    expect(plan.effects).toEqual([expect.objectContaining({ kind: 'alarm', duration: ALARM_MS }), expect.objectContaining({ kind: 'sound', sound: 'alarm' })])
  })

  it('only fires for merges inside the no-deploy window', () => {
    const merged = { kind: 'merged', at: 'x', pr, queueJump: false } as const
    expect(alarmFor(merged, true)?.id).toBe('egg:fire-alarm:x')
    expect(alarmFor(merged, false)).toBeNull()
    expect(alarmFor({ kind: 'closed', at: 'x', pr }, true)).toBeNull()
  })
})
