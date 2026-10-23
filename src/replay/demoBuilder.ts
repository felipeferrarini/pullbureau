import { fictionalAvatar } from '@/shared/avatar'
import { buildSnapshot } from '@/domain/snapshot'
import { PERSON_MODEL_IDS } from '@/shared/characters'
import type { HistoryPr, Message, OpenPr, PrThread, Snapshot } from '@/types/domain'
import { type ReplayFixture, threadKey } from '@/types/replay'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const DEMO_T0 = Date.parse('2026-10-15T13:00:00Z') // Thursday 13:00 UTC
const LAST_REVIEW_AT = '2026-10-14T18:00:00Z' // Wednesday 18:00 UTC

export const DEMO_MEMBERS = ['alice', 'henry', 'bob', 'carol', 'dave', 'erin', 'grace', 'frank']
const REPOS = ['api', 'web', 'cli', 'worker', 'payments-api', 'infra']
const TITLES = [
  'feat: add search filters',
  'fix: correct pagination',
  'chore: update dependencies',
  'refactor: extract billing service',
  'feat: add project dashboard',
  'fix: correct calendar timezone',
  'feat: export PDF report',
  'test: cover checkout flow',
]
const AGES_DAYS = [0, 1, 2, 4, 6, 9, 12, 16, 22, 30, 45, 61, 90, 120]
const DEMO_PR_COUNT = 48

const EXTRA_REPOS = ['search', 'docs', 'notifications', 'website', 'admin']
// A fictional distribution with two active reviewers.
const REVIEW_SHARE: [string, number][] = [['erin', 17], ['alice', 14], ['bob', 5], ['dave', 4]]
const REVIEW_SPACING = 15 * HOUR
const REVIEWED_AUTHORS = ['alice', 'carol', 'frank']

type DemoPrSpec = { repo: string; number: number; title: string; ageMs: number; author: string; ci: OpenPr['ci'] }

const EXTRA_OPEN: DemoPrSpec[] = [
  { repo: 'search', number: 501, title: 'feat: filter by category', ageMs: 6 * HOUR, author: 'dave', ci: 'success' },
  { repo: 'search', number: 561, title: 'refactor: split data importer', ageMs: 60 * DAY + 3 * HOUR, author: 'frank', ci: 'failure' },
  { repo: 'docs', number: 502, title: 'fix: sort records consistently', ageMs: 2 * DAY, author: 'bob', ci: 'success' },
  { repo: 'docs', number: 560, title: 'feat: add error log', ageMs: 30 * DAY - 3 * MINUTE, author: 'alice', ci: 'success' },
  { repo: 'notifications', number: 503, title: 'feat: send email reminders', ageMs: 4 * DAY, author: 'carol', ci: 'pending' },
  { repo: 'website', number: 504, title: 'chore: update home banner', ageMs: 9 * DAY, author: 'erin', ci: 'success' },
  { repo: 'admin', number: 505, title: 'feat: add manual refunds', ageMs: 3 * DAY, author: 'alice', ci: 'failure' },
]

const DUSTY_OPEN: DemoPrSpec[] = [
  { repo: 'task-runner', number: 601, title: 'chore: update report timer', ageMs: 21 * DAY, author: 'carol', ci: 'failure' },
  { repo: 'task-runner', number: 602, title: 'fix: prevent duplicate monthly jobs', ageMs: 48 * DAY, author: 'dave', ci: 'success' },
  { repo: 'review-tools', number: 611, title: 'feat: suggest reviewers', ageMs: 75 * DAY, author: 'alice', ci: 'none' },
  { repo: 'portal', number: 621, title: 'fix: support portal login', ageMs: 140 * DAY, author: 'alice', ci: 'failure' },
  { repo: 'portal', number: 622, title: 'chore: remove obsolete dependency', ageMs: 33 * DAY, author: 'frank', ci: 'success' },
]

const BRAWL = { repo: 'api', number: 412, threadId: 'T-412' }
const BRAWL_LINES = [
  'Why did this billing rule move into the controller?',
  'The service is getting too large to follow.',
  'Business rules need a separate unit so we can test them.',
  'The tests pass; please try them.',
  'We need a test for this edge case on line 88.',
  'That line is unchanged, I only moved it.',
  'The behavior is the same but the responsibility moved.',
  'Where should it go instead?',
  'A dedicated use case would make this easier to test.',
  'We have not used that pattern recently.',
  'This could be a useful place to start.',
  'I will request changes until we agree on the boundary.',
]
const BRAWL_REPLY = 'Agreed, let us split the service into smaller modules.'

const iso = (ms: number) => new Date(ms).toISOString()
const at = (minutes: number) => iso(DEMO_T0 + minutes * MINUTE)
const url = (repo: string, number: number) => `https://github.com/acme/${repo}/pull/${number}`

function demoPr(i: number): OpenPr {
  const repo = i % 3 === 0 ? 'api' : REPOS[i % REPOS.length]
  const number = 300 + i
  const createdAt = iso(DEMO_T0 - AGES_DAYS[i % AGES_DAYS.length] * DAY - ((i % 5) + 1) * HOUR)
  return {
    repo,
    number,
    title: TITLES[i % TITLES.length],
    url: url(repo, number),
    author: i % 4 === 0 ? 'alice' : DEMO_MEMBERS[i % DEMO_MEMBERS.length],
    authorIsBot: false,
    createdAt,
    isDraft: i % 11 === 5,
    ci: i % 2 === 0 ? 'failure' : 'success',
    ciAt: iso(Date.parse(createdAt) + 20 * MINUTE),
    reviews: [],
    messages: [],
  }
}

function specPr(spec: DemoPrSpec): OpenPr {
  const createdAt = iso(DEMO_T0 - spec.ageMs)
  return {
    repo: spec.repo,
    number: spec.number,
    title: spec.title,
    url: url(spec.repo, spec.number),
    author: spec.author,
    authorIsBot: false,
    createdAt,
    isDraft: false,
    ci: spec.ci,
    ciAt: spec.ci === 'none' || spec.ci === 'pending' ? null : iso(Date.parse(createdAt) + 20 * MINUTE),
    reviews: [],
    messages: [],
  }
}

function brawlPr(withReply: boolean): OpenPr {
  const messages: Message[] = BRAWL_LINES.map((body, i) => ({
    author: i % 2 ? 'erin' : 'alice',
    at: iso(DEMO_T0 - 2 * DAY + i * 37 * MINUTE),
    body,
    threadId: BRAWL.threadId,
  }))
  if (withReply) messages.push({ author: 'alice', at: at(3), body: BRAWL_REPLY, threadId: BRAWL.threadId })
  return {
    repo: BRAWL.repo,
    number: BRAWL.number,
    title: 'refactor: move billing rules to controller',
    url: url(BRAWL.repo, BRAWL.number),
    author: 'alice',
    authorIsBot: false,
    createdAt: iso(DEMO_T0 - 3 * DAY),
    isDraft: false,
    ci: 'failure',
    ciAt: iso(DEMO_T0 - 2 * DAY),
    reviews: [{ reviewer: 'erin', state: 'changes_requested', at: LAST_REVIEW_AT }],
    messages,
  }
}

function mergedHistory(): HistoryPr[] {
  return Array.from({ length: 24 }, (_, k) => {
    const repo = REPOS[k % REPOS.length]
    const number = 200 + k
    const mergedAt = iso(DEMO_T0 - (k + 1) * DAY)
    return {
      repo,
      number,
      title: TITLES[k % TITLES.length],
      url: url(repo, number),
      author: DEMO_MEMBERS[k % DEMO_MEMBERS.length],
      authorIsBot: false,
      state: 'merged',
      createdAt: iso(Date.parse(mergedAt) - 2 * DAY),
      mergedAt,
      closedAt: mergedAt,
      reviews: [{ reviewer: DEMO_MEMBERS[(k + 2) % DEMO_MEMBERS.length], state: 'approved', at: iso(Date.parse(mergedAt) - 2 * HOUR) }],
    }
  })
}

function interleavedReviewers(): string[] {
  const most = Math.max(...REVIEW_SHARE.map(([, count]) => count))
  return Array.from({ length: most }, (_, round) => REVIEW_SHARE.filter(([, count]) => round < count).map(([login]) => login)).flat()
}

function topReviewerHistory(): HistoryPr[] {
  return interleavedReviewers().map((reviewer, k) => {
    const repo = EXTRA_REPOS[k % EXTRA_REPOS.length]
    const number = 700 + k
    const mergedAt = iso(DEMO_T0 - 2 * DAY - k * REVIEW_SPACING)
    return {
      repo,
      number,
      title: TITLES[(k + 3) % TITLES.length],
      url: url(repo, number),
      author: REVIEWED_AUTHORS[k % REVIEWED_AUTHORS.length],
      authorIsBot: false,
      state: 'merged',
      createdAt: iso(Date.parse(mergedAt) - (1 + (k % 3)) * DAY),
      mergedAt,
      closedAt: mergedAt,
      reviews: [{ reviewer, state: 'approved', at: iso(Date.parse(mergedAt) - 3 * HOUR) }],
    }
  })
}

const asHistory = (pr: OpenPr): HistoryPr => ({
  repo: pr.repo,
  number: pr.number,
  title: pr.title,
  url: pr.url,
  author: pr.author,
  authorIsBot: pr.authorIsBot,
  state: 'open',
  createdAt: pr.createdAt,
  mergedAt: null,
  closedAt: null,
  reviews: pr.reviews,
})

function momentSnapshot(minutes: number, open: OpenPr[], history: HistoryPr[]): Snapshot {
  const snapshot = buildSnapshot({
    open,
    history: [...history, ...open.map(asHistory)],
    members: DEMO_MEMBERS,
    now: new Date(DEMO_T0 + minutes * MINUTE),
    modelIds: PERSON_MODEL_IDS,
    overrides: {},
    excluded: ['grace'],
    org: 'acme',
    ctoLogin: 'alice',
    stale: false,
  })
  return { ...snapshot, people: snapshot.people.map(person => ({ ...person, avatarUrl: fictionalAvatar(person.login) })) }
}

const replace = (list: OpenPr[], changed: OpenPr[]) => list.map(pr => changed.find(c => c.number === pr.number) ?? pr)

export function buildDemoFixture(): ReplayFixture {
  const base = [...Array.from({ length: DEMO_PR_COUNT }, (_, i) => demoPr(i)), ...[...EXTRA_OPEN, ...DUSTY_OPEN].map(specPr)]
  const merged = [...mergedHistory(), ...topReviewerHistory()]
  const hotfix: OpenPr = { ...demoPr(0), repo: 'api', number: 451, title: 'hotfix: restore production login', url: url('api', 451), author: 'carol', createdAt: at(1), ci: 'pending', ciAt: null }
  const approved: OpenPr = { ...base[1], reviews: [{ reviewer: 'bob', state: 'approved', at: at(2) }] }
  const failed: OpenPr = { ...base[3], ci: 'failure', ciAt: at(4) }
  const passed: OpenPr = { ...base[8], ci: 'success', ciAt: at(9) }

  const first = [...base, brawlPr(false)]
  const second = [...replace(base, [approved, failed]), brawlPr(true), hotfix]
  const leaving = [base[4].number, base[6].number, hotfix.number]
  const third = replace(second, [passed]).filter(pr => !leaving.includes(pr.number))
  const mergedNow: HistoryPr = { ...asHistory(base[4]), state: 'merged', mergedAt: at(7), closedAt: at(7), reviews: [{ reviewer: 'bob', state: 'approved', at: at(6) }] }
  const closedNow: HistoryPr = { ...asHistory(base[6]), state: 'closed', closedAt: at(8) }
  const queueJump: HistoryPr = { ...asHistory(hotfix), state: 'merged', mergedAt: at(9), closedAt: at(9) }

  const brawl = brawlPr(true)
  const thread: PrThread = { repo: brawl.repo, number: brawl.number, title: brawl.title, url: brawl.url, author: brawl.author, state: 'open', reviews: brawl.reviews, messages: brawl.messages }

  return {
    snapshots: [
      momentSnapshot(0, first, merged),
      momentSnapshot(5, second, merged),
      momentSnapshot(10, third, [...merged, mergedNow, closedNow, queueJump]),
    ],
    threads: { [threadKey(BRAWL.repo, BRAWL.number)]: thread },
  }
}
