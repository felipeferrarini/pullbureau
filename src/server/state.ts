import { loadConfig } from '@/config'
import { buildSnapshot } from '@/domain/snapshot'
import { DAY_MS, MONTH_MS } from '@/domain/time'
import { completedRunTimes, fetchActionRuns } from '@/github/actions'
import { type BotFilter, createBotFilter } from '@/github/actors'
import { type Graphql, createGraphql } from '@/github/client'
import { fetchHistoryPrs, fetchOpenPrs, fetchPrThread } from '@/github/fetch'
import { listOrgMembers } from '@/github/membership'
import { normalizeHistoryPr, normalizeOpenPr, normalizeThread } from '@/github/normalize'
import { PERSON_MODEL_IDS } from '@/shared/characters'
import type { AppConfig } from '@/types/config'
import type { HistoryPr, OpenPr, PrThread, Snapshot } from '@/types/domain'
import { createTtlCache } from './ttlCache'

const OPEN_TTL_MS = 120_000
const HISTORY_TTL_MS = 600_000
const MEMBERS_TTL_MS = 600_000

const openCache = createTtlCache<OpenPr[]>(OPEN_TTL_MS)
const historyCache = createTtlCache<HistoryPr[]>(HISTORY_TTL_MS)
const membersCache = createTtlCache<string[]>(MEMBERS_TTL_MS)

let config: AppConfig | null = null
const getConfig = () => (config ??= loadConfig())

async function ciTimesFor(cfg: AppConfig, repos: string[], now: Date): Promise<Map<string, string>> {
  const since = new Date(now.getTime() - DAY_MS)
  const runs = await Promise.all(repos.map(repo =>
    fetchActionRuns(cfg.token, cfg.org, repo, since).catch(error => {
      console.warn(`actions runs failed for ${repo}`, error)
      return []
    }),
  ))
  return completedRunTimes(runs.flat())
}

async function loadOpen(cfg: AppConfig, gql: Graphql, isBot: BotFilter, now: Date): Promise<OpenPr[]> {
  const raw = await fetchOpenPrs(gql, cfg.org)
  const ciTimes = await ciTimesFor(cfg, [...new Set(raw.map(pr => pr.repository.name))], now)
  return raw.map(pr => normalizeOpenPr(pr, isBot, ciTimes))
}

export async function getState(now = new Date()): Promise<Snapshot> {
  const cfg = getConfig()
  const gql = createGraphql(cfg.token)
  const isBot = createBotFilter(cfg.ignoredLogins)
  const [open, history, members] = await Promise.all([
    openCache(() => loadOpen(cfg, gql, isBot, now)),
    historyCache(async () => (await fetchHistoryPrs(gql, cfg.org, new Date(now.getTime() - MONTH_MS))).map(raw => normalizeHistoryPr(raw, isBot))),
    membersCache(() => listOrgMembers(cfg.token, cfg.org)),
  ])
  return buildSnapshot({
    open: open.value,
    history: history.value,
    members: members.value,
    now,
    modelIds: PERSON_MODEL_IDS,
    overrides: cfg.characterOverrides,
    excluded: cfg.excludedLogins,
    org: cfg.org,
    ctoLogin: cfg.ctoLogin,
    stale: open.stale || history.stale || members.stale,
  })
}

export async function getThread(repo: string, number: number): Promise<PrThread | null> {
  const cfg = getConfig()
  const raw = await fetchPrThread(createGraphql(cfg.token), cfg.org, repo, number)
  return raw ? normalizeThread(raw, createBotFilter(cfg.ignoredLogins)) : null
}
