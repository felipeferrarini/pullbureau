import { GHOST_LOGIN } from '@/shared/constants'
import { hashString } from '@/shared/hash'
import type { HistoryPr, OpenPr, Person } from '@/types/domain'
import { rankLogins } from './reviews'
import { MONTH_MS, isWithin } from './time'

export type PeopleInput = {
  members: string[]
  open: OpenPr[]
  history: HistoryPr[]
  now: Date
  modelIds: string[]
  overrides: Record<string, string>
  excluded: string[]
}

export const avatarUrl = (login: string) => `https://github.com/${login}.png?size=96`

export function pickModel(login: string, modelIds: string[], overrides: Record<string, string>): string {
  if (overrides[login]) return overrides[login]
  const pinned = new Set(Object.values(overrides))
  const pool = modelIds.filter(id => !pinned.has(id))
  const draw = pool.length ? pool : modelIds
  if (!draw.length) return 'none'
  return draw[hashString(login) % draw.length]
}

function homeRepoOf(login: string, history: HistoryPr[], now: Date): string | null {
  const perRepo = new Map<string, number>()
  for (const pr of history) {
    const count = pr.reviews.filter(review => review.reviewer === login && pr.author !== login && isWithin(review.at, now, MONTH_MS)).length
    if (count) perRepo.set(pr.repo, (perRepo.get(pr.repo) ?? 0) + count)
  }
  return rankLogins(perRepo)[0] ?? null
}

export function buildPeople(input: PeopleInput): Person[] {
  const excluded = new Set(input.excluded.map(login => login.toLowerCase()))
  const logins = new Set([...input.members, ...input.open.map(pr => pr.author)])
  return [...logins]
    .filter(login => login !== GHOST_LOGIN && !excluded.has(login.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map(login => ({
      login,
      avatarUrl: avatarUrl(login),
      modelId: pickModel(login, input.modelIds, input.overrides),
      homeRepo: homeRepoOf(login, input.history, input.now),
    }))
}
