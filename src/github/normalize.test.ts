import { describe, expect, it } from 'vitest'
import { createBotFilter } from './actors'
import { normalizeHistoryPr, normalizeOpenPr, normalizeThread } from './normalize'
import { bot, rawComment, rawHistoryPr, rawOpenPr, rawReview, rawThreadPr, rollup, user } from './testFactories'

const isBot = createBotFilter(['sonarcloud'])
const felipe = user('example-user')
const henry = user('erin')

describe('normalizeOpenPr', () => {
  it('keeps drafts and unlabelled PRs in the waiting room', () => {
    expect(normalizeOpenPr(rawOpenPr({ labels: { nodes: [] } }), isBot)).toMatchObject({ isDraft: false, isReady: false })
    expect(normalizeOpenPr(rawOpenPr({ labels: { nodes: [{ name: 'ready-for-review' }] } }), isBot).isReady).toBe(true)
    expect(normalizeOpenPr(rawOpenPr({ isDraft: true, labels: { nodes: [{ name: 'ready-for-review' }] } }), isBot).isDraft).toBe(true)
  })
  it('supports a configured readiness label', () => {
    const raw = rawOpenPr({ labels: { nodes: [{ name: 'ship-it' }] } })
    expect(normalizeOpenPr(raw, isBot, new Map(), 'ship-it').isReady).toBe(true)
    expect(normalizeOpenPr(raw, isBot).isReady).toBe(false)
  })

  it('maps identity fields', () => {
    const pr = normalizeOpenPr(rawOpenPr({ number: 42, title: 't', isDraft: true }), isBot)
    expect(pr).toMatchObject({ repo: 'api', number: 42, title: 't', author: 'example-user', isDraft: true })
  })

  it('maps a deleted author to ghost', () => {
    expect(normalizeOpenPr(rawOpenPr({ author: null }), isBot).author).toBe('ghost')
  })

  it('drops bot reviews and comments, pending/dismissed reviews and reviews without date', () => {
    const pr = normalizeOpenPr(rawOpenPr({
      reviews: { nodes: [
        rawReview(bot('coderabbitai'), 'COMMENTED', '2026-10-11T00:00:00Z'),
        rawReview(henry, 'PENDING', null),
        rawReview(henry, 'DISMISSED', '2026-10-11T01:00:00Z'),
        rawReview(henry, 'CHANGES_REQUESTED', '2026-10-11T02:00:00Z'),
      ] },
      comments: { nodes: [rawComment(user('sonarcloud'), '2026-10-11T00:00:00Z'), rawComment(felipe, '2026-10-11T03:00:00Z', 'hi')] },
    }), isBot)
    expect(pr.reviews).toEqual([{ reviewer: 'erin', state: 'changes_requested', at: '2026-10-11T02:00:00Z' }])
    expect(pr.messages).toEqual([{ author: 'example-user', at: '2026-10-11T03:00:00Z', body: 'hi', threadId: null }])
  })

  it('merges issue comments and review thread comments in time order', () => {
    const pr = normalizeOpenPr(rawOpenPr({
      comments: { nodes: [rawComment(felipe, '2026-10-11T05:00:00Z', 'b')] },
      reviewThreads: { nodes: [{ id: 'T1', comments: { nodes: [rawComment(henry, '2026-10-11T04:00:00Z', 'a')] } }] },
    }), isBot)
    expect(pr.messages.map(m => [m.body, m.threadId])).toEqual([['a', 'T1'], ['b', null]])
  })

  it('maps the ci rollup state and takes ciAt from the action runs of the last commit', () => {
    const commit = (oid: string, state: string) => ({ commits: { nodes: [{ commit: { oid, statusCheckRollup: rollup(state) } }] } })
    const ciTimes = new Map([['sha-1', '2026-10-11T02:00:00Z']])
    expect(normalizeOpenPr(rawOpenPr(commit('sha-1', 'ERROR')), isBot, ciTimes)).toMatchObject({ ci: 'failure', ciAt: '2026-10-11T02:00:00Z' })
    expect(normalizeOpenPr(rawOpenPr(commit('sha-2', 'SUCCESS')), isBot, ciTimes)).toMatchObject({ ci: 'success', ciAt: null })
    expect(normalizeOpenPr(rawOpenPr(commit('sha-1', 'PENDING')), isBot).ci).toBe('pending')
    expect(normalizeOpenPr(rawOpenPr({ commits: { nodes: [] } }), isBot, ciTimes)).toMatchObject({ ci: 'none', ciAt: null })
  })
})

describe('normalizeOpenPr with partial data', () => {
  it('treats null connections and null items as empty', () => {
    const pr = normalizeOpenPr(rawOpenPr({
      reviews: null,
      comments: { nodes: [null, rawComment(felipe, '2026-10-11T03:00:00Z', 'hi')] },
      reviewThreads: { nodes: [null, { id: 'T1', comments: null }] },
      commits: null,
    }), isBot)
    expect(pr).toMatchObject({ reviews: [], ci: 'none', ciAt: null })
    expect(pr.messages.map(m => m.body)).toEqual(['hi'])
  })
})

describe('authorIsBot', () => {
  it('flags PRs opened by bots or ignored logins', () => {
    expect(normalizeOpenPr(rawOpenPr({ author: bot('dependabot') }), isBot).authorIsBot).toBe(true)
    expect(normalizeHistoryPr(rawHistoryPr({ author: user('sonarcloud') }), isBot).authorIsBot).toBe(true)
    expect(normalizeOpenPr(rawOpenPr(), isBot).authorIsBot).toBe(false)
  })
})

describe('normalizeHistoryPr', () => {
  it('maps state and timestamps', () => {
    const pr = normalizeHistoryPr(rawHistoryPr({ state: 'MERGED', mergedAt: '2026-10-12T00:00:00Z', closedAt: '2026-10-12T00:00:00Z' }), isBot)
    expect(pr).toMatchObject({ state: 'merged', mergedAt: '2026-10-12T00:00:00Z' })
  })
})

describe('normalizeThread', () => {
  it('keeps every human message and review', () => {
    const thread = normalizeThread(rawThreadPr({
      state: 'CLOSED',
      reviews: { nodes: [rawReview(henry, 'APPROVED', '2026-10-12T00:00:00Z')] },
      comments: { nodes: [rawComment(felipe, '2026-10-11T00:00:00Z'), rawComment(bot('x'), '2026-10-11T01:00:00Z')] },
    }), isBot)
    expect(thread.state).toBe('closed')
    expect(thread.reviews).toHaveLength(1)
    expect(thread.messages).toHaveLength(1)
  })
})
