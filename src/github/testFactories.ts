import type { RawActor, RawComment, RawHistoryPr, RawOpenPr, RawReview, RawReviewState, RawRollup, RawThreadPr } from '@/types/github'

export const user = (login: string): RawActor => ({ __typename: 'User', login })
export const bot = (login: string): RawActor => ({ __typename: 'Bot', login })

export const rawComment = (author: RawActor, createdAt: string, body = 'ok'): RawComment => ({ author, createdAt, body })

export const rawReview = (author: RawActor, state: RawReviewState, submittedAt: string | null, body = ''): RawReview =>
  ({ author, state, submittedAt, body })

export const rollup = (state: string): RawRollup => ({ state })

const base = {
  number: 1,
  title: 'feat: x',
  url: 'https://github.com/acme/api/pull/1',
  createdAt: '2026-10-10T12:00:00Z',
  repository: { name: 'api' },
  author: user('example-user'),
}

export function rawOpenPr(overrides: Partial<RawOpenPr> = {}): RawOpenPr {
  return {
    ...base,
    isDraft: false,
    labels: { nodes: [{ name: 'ready-for-review' }] },
    reviews: { nodes: [] },
    comments: { nodes: [] },
    reviewThreads: { nodes: [] },
    commits: { nodes: [{ commit: { oid: 'sha-0', statusCheckRollup: null } }] },
    ...overrides,
  }
}

export function rawHistoryPr(overrides: Partial<RawHistoryPr> = {}): RawHistoryPr {
  return { ...base, state: 'OPEN', mergedAt: null, closedAt: null, reviews: { nodes: [] }, ...overrides }
}

export function rawThreadPr(overrides: Partial<RawThreadPr> = {}): RawThreadPr {
  return { ...base, state: 'OPEN', reviews: { nodes: [] }, comments: { nodes: [] }, reviewThreads: { nodes: [] }, ...overrides }
}
