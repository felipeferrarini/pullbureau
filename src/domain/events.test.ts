import { describe, expect, it } from 'vitest'
import { deriveEvents } from './events'
import { NOW, historyPr, message, openPr, review } from './testFactories'

describe('deriveEvents', () => {
  const recent = (minutesAgo: number) => new Date(NOW.getTime() - minutesAgo * 60_000).toISOString()

  it('emits pr_opened once even when the PR is in both lists', () => {
    const events = deriveEvents([openPr({ number: 5, createdAt: recent(30) })], [historyPr({ number: 5, createdAt: recent(30) })], NOW)
    expect(events.filter(e => e.kind === 'pr_opened')).toHaveLength(1)
  })

  it('emits deduplicated reviews from both lists', () => {
    const r = review('henry', recent(10), 'changes_requested')
    const events = deriveEvents([openPr({ reviews: [r] })], [historyPr({ reviews: [r] })], NOW)
    expect(events.filter(e => e.kind === 'review')).toEqual([expect.objectContaining({ reviewer: 'henry', state: 'changes_requested' })])
  })

  it('emits comments with replyTo inside the same review thread only', () => {
    const events = deriveEvents([openPr({ messages: [
      message('henry', recent(20), 'por que aqui?', 'T1'),
      message('example-user', recent(15), 'porque sim', 'T1'),
      message('example-user', recent(14), 'e mais', 'T1'),
      message('carol', recent(10), 'issue comment'),
    ] })], [], NOW)
    const comments = events.filter(e => e.kind === 'comment')
    expect(comments.map(c => (c.kind === 'comment' ? c.replyTo : 'x'))).toEqual([null, 'henry', null, null])
  })

  it('emits ci only for finished results inside the window', () => {
    const events = deriveEvents([
      openPr({ number: 1, ci: 'failure', ciAt: recent(5) }),
      openPr({ number: 2, ci: 'pending', ciAt: recent(5) }),
      openPr({ number: 3, ci: 'success', ciAt: recent(60 * 30) }),
    ], [], NOW)
    expect(events.filter(e => e.kind === 'ci')).toEqual([expect.objectContaining({ result: 'failure', pr: expect.objectContaining({ number: 1 }) })])
  })

  it('emits merged and closed from history', () => {
    const events = deriveEvents([], [
      historyPr({ number: 1, state: 'merged', mergedAt: recent(5), closedAt: recent(5) }),
      historyPr({ number: 2, state: 'closed', closedAt: recent(4) }),
    ], NOW)
    expect(events.map(e => e.kind)).toEqual(['merged', 'closed'])
  })

  it('flags merges without any human review as queue jumps', () => {
    const events = deriveEvents([], [
      historyPr({ number: 1, state: 'merged', mergedAt: recent(5), reviews: [review('henry', recent(10))] }),
      historyPr({ number: 2, state: 'merged', mergedAt: recent(4), reviews: [review('example-user', recent(6), 'commented')] }),
      historyPr({ number: 3, state: 'merged', mergedAt: recent(3) }),
    ], NOW)
    expect(events.flatMap(e => (e.kind === 'merged' ? [[e.pr.number, e.queueJump]] : []))).toEqual([[1, false], [2, true], [3, true]])
  })

  it('sorts by time and strips extra fields from pr refs', () => {
    const events = deriveEvents([openPr({ createdAt: recent(50), messages: [message('a', recent(40))] })], [], NOW)
    expect(events.map(e => e.kind)).toEqual(['pr_opened', 'comment'])
    expect(Object.keys(events[0].pr).sort()).toEqual(['author', 'number', 'repo', 'title', 'url'])
  })
})
