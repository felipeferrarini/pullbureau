import { BUSINESS_END_HOUR, BUSINESS_START_HOUR } from '@/shared/constants'
import { isReadyForReview } from './queue'
import type { HistoryPr, HudStats, OpenPr, Review } from '@/types/domain'
import { hasHumanReview, humanReviews } from './reviews'
import { MONTH_MS, WEEK_MS, businessHoursBetween, isWithin } from './time'

export const UNREVIEWED_AFTER_BUSINESS_HOURS = BUSINESS_END_HOUR - BUSINESS_START_HOUR

type TrackedPr = Pick<HistoryPr, 'repo' | 'number' | 'author' | 'authorIsBot' | 'state' | 'createdAt' | 'mergedAt' | 'closedAt'> & { reviews: Review[] }

const keyOf = (pr: { repo: string; number: number }) => `${pr.repo}#${pr.number}`
const byAt = (a: { at: string }, b: { at: string }) => Date.parse(a.at) - Date.parse(b.at)
const round1 = (value: number) => Math.round(value * 10) / 10

export function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function mergeReviews(a: Review[], b: Review[]): Review[] {
  return [...new Map([...a, ...b].map(review => [`${review.reviewer}|${review.at}`, review])).values()].sort(byAt)
}

function trackedPrs(open: OpenPr[], history: HistoryPr[]): TrackedPr[] {
  const byKey = new Map<string, TrackedPr>(history.map(pr => [keyOf(pr), pr]))
  for (const pr of open) {
    const known = byKey.get(keyOf(pr))
    byKey.set(keyOf(pr), { ...pr, state: 'open', mergedAt: null, closedAt: null, reviews: mergeReviews(known?.reviews ?? [], pr.reviews) })
  }
  return [...byKey.values()]
}

const leftAt = (pr: TrackedPr) => (pr.state === 'merged' ? pr.mergedAt : pr.state === 'closed' ? pr.closedAt : null)

function queue7dAgo(queue: OpenPr[], tracked: TrackedPr[], now: Date): number {
  const cutoff = now.getTime() - WEEK_MS
  const before = (pr: { createdAt: string }) => Date.parse(pr.createdAt) < cutoff
  const stillOpen = queue.filter(before).length
  const leftSince = tracked.filter(pr => pr.state !== 'open' && before(pr) && isWithin(leftAt(pr), now, WEEK_MS)).length
  return stillOpen + leftSince
}

function firstReviewHours(pr: TrackedPr, now: Date): number[] {
  const first = humanReviews(pr).find(review => Date.parse(review.at) >= Date.parse(pr.createdAt))
  return first && isWithin(first.at, now, MONTH_MS) ? [businessHoursBetween(pr.createdAt, first.at)] : []
}

function mergeHours(pr: TrackedPr, now: Date): number[] {
  return pr.state === 'merged' && pr.mergedAt && isWithin(pr.mergedAt, now, MONTH_MS) ? [businessHoursBetween(pr.createdAt, pr.mergedAt)] : []
}

const roundedMedian = (values: number[]) => {
  const value = median(values)
  return value === null ? null : round1(value)
}

function waitedOneBusinessDay(createdAt: string, now: Date): boolean {
  const from = Math.max(Date.parse(createdAt), now.getTime() - WEEK_MS)
  return businessHoursBetween(new Date(from).toISOString(), now.toISOString()) >= UNREVIEWED_AFTER_BUSINESS_HOURS
}

function unreviewed(queue: OpenPr[], now: Date): OpenPr[] {
  return queue
    .filter(pr => !hasHumanReview(pr) && waitedOneBusinessDay(pr.createdAt, now))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
}

function ciRedPct(queue: OpenPr[]): number | null {
  const withCi = queue.filter(pr => pr.ci !== 'none')
  return withCi.length ? Math.round((withCi.filter(pr => pr.ci === 'failure').length / withCi.length) * 100) : null
}

export function buildStats(open: OpenPr[], history: HistoryPr[], now: Date): HudStats {
  const queue = open.filter(isReadyForReview)
  const tracked = trackedPrs(open, history)
  const waiting = unreviewed(queue, now)
  return {
    queueNow: queue.length,
    queue7dAgo: queue7dAgo(queue, tracked, now),
    inflow7d: tracked.filter(pr => !pr.authorIsBot && isWithin(pr.createdAt, now, WEEK_MS)).length,
    outflow7d: tracked.filter(pr => pr.state !== 'open' && isWithin(leftAt(pr), now, WEEK_MS)).length,
    medianFirstReviewHours30d: roundedMedian(tracked.flatMap(pr => firstReviewHours(pr, now))),
    medianMergeHours30d: roundedMedian(tracked.flatMap(pr => mergeHours(pr, now))),
    unreviewedCount: waiting.length,
    oldestUnreviewed: waiting[0] ? { repo: waiting[0].repo, number: waiting[0].number } : null,
    ciRedPct: ciRedPct(queue),
  }
}
