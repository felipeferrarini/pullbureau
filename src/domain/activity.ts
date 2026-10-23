import type { Counter, CounterSplit, CounterSplitRule, HistoryPr, OpenPr } from '@/types/domain'
import { DAY_MS, WEEK_MS, isWithin } from './time'

export const COUNTER_SPLIT_RULE: CounterSplitRule = { activeDays: 14, maxVisible: 10 }

type Activity = { key: string; at: string }

const keyOf = (pr: { repo: string; number: number }) => `${pr.repo}#${pr.number}`

function openActivity(pr: OpenPr): Activity[] {
  const key = keyOf(pr)
  return [
    { key: `${key}|created`, at: pr.createdAt },
    ...(pr.ciAt ? [{ key: `${key}|ci|${pr.ciAt}`, at: pr.ciAt }] : []),
    ...pr.reviews.map(review => ({ key: `${key}|review|${review.reviewer}|${review.at}`, at: review.at })),
    ...pr.messages.map(message => ({ key: `${key}|message|${message.author}|${message.at}`, at: message.at })),
  ]
}

function closingActivity(pr: HistoryPr): Activity[] {
  if (pr.state === 'merged' && pr.mergedAt) return [{ key: `${keyOf(pr)}|merged`, at: pr.mergedAt }]
  if (pr.state === 'closed' && pr.closedAt) return [{ key: `${keyOf(pr)}|closed`, at: pr.closedAt }]
  return []
}

function historyActivity(pr: HistoryPr): Activity[] {
  const key = keyOf(pr)
  return [
    { key: `${key}|created`, at: pr.createdAt },
    ...closingActivity(pr),
    ...pr.reviews.map(review => ({ key: `${key}|review|${review.reviewer}|${review.at}`, at: review.at })),
  ]
}

function repoActivity(repo: string, open: OpenPr[], history: HistoryPr[]): Activity[] {
  const all = [...open.filter(pr => pr.repo === repo).flatMap(openActivity), ...history.filter(pr => pr.repo === repo).flatMap(historyActivity)]
  return [...new Map(all.map(activity => [activity.key, activity])).values()]
}

export function counterActivity(repo: string, open: OpenPr[], history: HistoryPr[], now: Date): Pick<Counter, 'lastActivityAt' | 'activity7d'> {
  const activity = repoActivity(repo, open, history)
  const latest = activity.reduce<string | null>((max, { at }) => (!max || Date.parse(at) > Date.parse(max) ? at : max), null)
  return { lastActivityAt: latest, activity7d: activity.filter(({ at }) => isWithin(at, now, WEEK_MS)).length }
}

export function isCounterActive(counter: Counter, now: Date, activeDays = COUNTER_SPLIT_RULE.activeDays): boolean {
  return isWithin(counter.lastActivityAt, now, activeDays * DAY_MS)
}

export function splitCounters(counters: Counter[], now: Date, rule: CounterSplitRule = COUNTER_SPLIT_RULE): CounterSplit {
  const visible = counters.filter(counter => isCounterActive(counter, now, rule.activeDays)).slice(0, rule.maxVisible)
  const shown = new Set(visible)
  return { visible, closed: counters.filter(counter => !shown.has(counter)) }
}
