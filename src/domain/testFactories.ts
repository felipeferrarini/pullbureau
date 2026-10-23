import type { Counter, HistoryPr, HudStats, Message, OpenPr, Person, QueuedPr, Review, ReviewState, Snapshot } from '@/types/domain'

export const NOW = new Date('2026-10-15T15:00:00Z')

export const review = (reviewer: string, at: string, state: ReviewState = 'approved'): Review => ({ reviewer, at, state })

export const message = (author: string, at: string, body = 'ok', threadId: string | null = null): Message => ({ author, at, body, threadId })

export function openPr(overrides: Partial<OpenPr> = {}): OpenPr {
  const number = overrides.number ?? 1
  const repo = overrides.repo ?? 'api'
  return {
    repo,
    number,
    title: 'feat: x',
    url: `https://github.com/acme/${repo}/pull/${number}`,
    author: 'example-user',
    authorIsBot: false,
    createdAt: '2026-10-10T12:00:00Z',
    isDraft: false,
    ci: 'none',
    ciAt: null,
    reviews: [],
    messages: [],
    ...overrides,
  }
}

export function historyPr(overrides: Partial<HistoryPr> = {}): HistoryPr {
  const number = overrides.number ?? 1
  const repo = overrides.repo ?? 'api'
  return {
    repo,
    number,
    title: 'feat: x',
    url: `https://github.com/acme/${repo}/pull/${number}`,
    author: 'example-user',
    authorIsBot: false,
    state: 'open',
    createdAt: '2026-10-01T12:00:00Z',
    mergedAt: null,
    closedAt: null,
    reviews: [],
    ...overrides,
  }
}

export function queuedPr(overrides: Partial<QueuedPr> = {}): QueuedPr {
  const number = overrides.number ?? 1
  const repo = overrides.repo ?? 'api'
  return {
    repo,
    number,
    title: 'feat: x',
    url: `https://github.com/acme/${repo}/pull/${number}`,
    author: 'example-user',
    createdAt: '2026-10-10T12:00:00Z',
    ageDays: 1,
    isDraft: false,
    ci: 'none',
    reviewedBy: [],
    discussion: { messages: 0, participants: [] },
    ...overrides,
  }
}

export function counter(overrides: Partial<Counter> = {}): Counter {
  return { repo: 'api', currentTicket: 0, queue: [], attendants: [], lastActivityAt: null, activity7d: 0, ...overrides }
}

export const person = (login: string, homeRepo: string | null = null, modelId = `model-${login}`): Person =>
  ({ login, avatarUrl: `https://github.com/${login}.png?size=96`, modelId, homeRepo })

export const emptyStats = (): HudStats => ({
  queueNow: 0,
  queue7dAgo: 0,
  inflow7d: 0,
  outflow7d: 0,
  medianFirstReviewHours30d: null,
  medianMergeHours30d: null,
  unreviewedCount: 0,
  oldestUnreviewed: null,
  ciRedPct: null,
})

export function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    generatedAt: NOW.toISOString(),
    stale: false,
    meta: { org: 'acme', ctoLogin: 'alice' },
    counters: [],
    waitingRoom: [],
    people: [],
    board: { ranking: [], employeeOfTheMonth: null, slacking: [] },
    strike: { active: false, since: null },
    oldestPr: null,
    events: [],
    stats: emptyStats(),
    ...overrides,
  }
}
