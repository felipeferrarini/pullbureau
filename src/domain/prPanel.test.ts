import { describe, expect, it } from 'vitest'
import type { PrThread } from '@/types/domain'
import { ageBadge, ciLabel, prTimeline, shortDateTime } from './prPanel'
import { message, queuedPr, review } from './testFactories'

describe('ageBadge', () => {
  it('heats up with age and fossilises after a month', () => {
    expect(ageBadge(0)).toEqual({ level: 'fresh', label: 'hoje' })
    expect(ageBadge(1)).toEqual({ level: 'fresh', label: '1 dia' })
    expect(ageBadge(2)).toEqual({ level: 'warm', label: '2 dias' })
    expect(ageBadge(6)).toEqual({ level: 'warm', label: '6 dias' })
    expect(ageBadge(7)).toEqual({ level: 'hot', label: '7 dias' })
    expect(ageBadge(29)).toEqual({ level: 'hot', label: '29 dias' })
    expect(ageBadge(30)).toEqual({ level: 'fossil', label: 'fóssil · 30 dias' })
  })
})

describe('ciLabel', () => {
  it('names every ci state', () => {
    expect([ciLabel('success'), ciLabel('failure'), ciLabel('pending'), ciLabel('none')]).toEqual(['CI passou', 'CI vermelho', 'CI rodando', 'sem CI'])
  })
})

describe('shortDateTime', () => {
  it('formats in Brasília time', () => {
    expect(shortDateTime('2026-10-02T17:32:00Z')).toBe('02/10 14:32')
  })
})

describe('prTimeline', () => {
  const pr = queuedPr({ author: 'ana', createdAt: '2026-10-10T12:00:00Z', ci: 'failure' })
  const thread = (overrides: Partial<PrThread> = {}): PrThread => ({
    repo: pr.repo,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    author: pr.author,
    state: 'open',
    reviews: [],
    messages: [],
    ...overrides,
  })

  it('starts with the opening and ends with the current ci without a thread', () => {
    expect(prTimeline(pr, null)).toEqual([
      { kind: 'opened', at: '2026-10-10T12:00:00Z', author: 'ana' },
      { kind: 'ci', state: 'failure', label: 'CI vermelho' },
    ])
  })

  it('interleaves stamped reviews and the last comments by time', () => {
    const items = prTimeline(
      pr,
      thread({
        reviews: [review('bia', '2026-10-11T12:00:00Z', 'changes_requested'), review('caio', '2026-10-13T12:00:00Z', 'approved')],
        messages: [
          message('dani', '2026-10-10T13:00:00Z', 'primeiro'),
          message('bia', '2026-10-12T12:00:00Z', 'olha o **teste**'),
          message('ana', '2026-10-12T13:00:00Z', 'corrigido'),
          message('caio', '2026-10-14T12:00:00Z', 'lgtm'),
        ],
      }),
    )
    expect(items).toEqual([
      { kind: 'opened', at: '2026-10-10T12:00:00Z', author: 'ana' },
      { kind: 'review', at: '2026-10-11T12:00:00Z', reviewer: 'bia', stamp: 'rejected', label: 'INDEFERIDO' },
      { kind: 'comment', at: '2026-10-12T12:00:00Z', author: 'bia', excerpt: 'olha o teste' },
      { kind: 'comment', at: '2026-10-12T13:00:00Z', author: 'ana', excerpt: 'corrigido' },
      { kind: 'review', at: '2026-10-13T12:00:00Z', reviewer: 'caio', stamp: 'approved', label: 'DEFERIDO' },
      { kind: 'comment', at: '2026-10-14T12:00:00Z', author: 'caio', excerpt: 'lgtm' },
      { kind: 'ci', state: 'failure', label: 'CI vermelho' },
    ])
  })

  it('stamps commented reviews as under analysis', () => {
    const items = prTimeline(pr, thread({ reviews: [review('bia', '2026-10-11T12:00:00Z', 'commented')] }))
    expect(items[1]).toMatchObject({ stamp: 'review', label: 'EM ANÁLISE' })
  })
})
