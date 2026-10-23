import { describe, expect, it } from 'vitest'
import type { PrRef, SceneEvent } from '@/types/domain'
import { tickerLine, tickerLines } from './ticker'

const pr = (repo: string, number: number): PrRef => ({ repo, number, title: 't', url: 'u', author: 'fulano' })

describe('tickerLine', () => {
  it('describes every event in portuguese', () => {
    const lines: [SceneEvent, string][] = [
      [{ kind: 'pr_opened', at: 'a', pr: pr('students', 1) }, '@fulano abriu students #1'],
      [{ kind: 'review', at: 'a', pr: pr('api', 412), reviewer: 'beltrano', state: 'approved' }, '@beltrano aprovou api #412'],
      [{ kind: 'review', at: 'a', pr: pr('api', 412), reviewer: 'beltrano', state: 'changes_requested' }, '@beltrano pediu mudanças em api #412'],
      [{ kind: 'review', at: 'a', pr: pr('api', 412), reviewer: 'beltrano', state: 'commented' }, '@beltrano comentou em api #412'],
      [{ kind: 'comment', at: 'a', pr: pr('students', 3), author: 'ciclano', replyTo: null, excerpt: 'x' }, '@ciclano comentou em students #3'],
      [{ kind: 'ci', at: 'a', pr: pr('students', 302), result: 'failure' }, 'CI falhou em students #302'],
      [{ kind: 'ci', at: 'a', pr: pr('students', 302), result: 'success' }, 'CI passou em students #302'],
      [{ kind: 'merged', at: 'a', pr: pr('api', 400), queueJump: false }, 'api #400 foi mergeada'],
      [{ kind: 'merged', at: 'a', pr: pr('students', 12), queueJump: true }, 'FURA-FILA! @fulano passou na frente em students #12'],
      [{ kind: 'closed', at: 'a', pr: pr('infra', 7) }, 'infra #7 foi fechada'],
    ]
    for (const [event, line] of lines) expect(tickerLine(event)).toBe(line)
  })
})

describe('tickerLines', () => {
  it('returns the latest events first, up to the limit', () => {
    const events: SceneEvent[] = [1, 2, 3].map(n => ({ kind: 'closed', at: `2026-10-15T1${n}:00:00Z`, pr: pr('infra', n) }))
    expect(tickerLines(events, 2)).toEqual(['infra #3 foi fechada', 'infra #2 foi fechada'])
    expect(tickerLines([], 5)).toEqual([])
  })
})
