import type { Counter, HistoryPr, OpenPr, QueuedPr } from '@/types/domain'
import { counterActivity } from './activity'
import { rankLogins, reviewCounts } from './reviews'
import { MONTH_MS, WEEK_MS, ageInDays, isWithin } from './time'

export const BRAWL_MIN_MESSAGES = 10

const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
const unique = (values: string[]) => [...new Set(values)]

export const isReadyForReview = (pr: Pick<OpenPr, 'isDraft' | 'isReady'>) => !pr.isDraft && pr.isReady !== false

export function toQueuedPr(pr: OpenPr, now: Date): QueuedPr {
  return {
    repo: pr.repo,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    author: pr.author,
    createdAt: pr.createdAt,
    ageDays: ageInDays(pr.createdAt, now),
    isDraft: pr.isDraft,
    ci: pr.ci,
    reviewedBy: unique(pr.reviews.map(review => review.reviewer)).filter(login => login !== pr.author),
    discussion: { messages: pr.messages.length, participants: unique(pr.messages.map(message => message.author)) },
  }
}

export function isBrawl(pr: QueuedPr): boolean {
  return pr.discussion.messages >= BRAWL_MIN_MESSAGES && pr.discussion.participants.length >= 2
}

function hadRecentActivity(pr: HistoryPr, now: Date): boolean {
  return [pr.createdAt, pr.mergedAt, pr.closedAt, ...pr.reviews.map(review => review.at)].some(iso => isWithin(iso, now, WEEK_MS))
}

function currentTicket(history: HistoryPr[], repo: string): number {
  const merged = history.filter(pr => pr.repo === repo && pr.mergedAt).sort((a, b) => Date.parse(b.mergedAt ?? '') - Date.parse(a.mergedAt ?? ''))
  return merged[0]?.number ?? 0
}

export function buildCounters(open: OpenPr[], history: HistoryPr[], now: Date): Counter[] {
  const repos = new Set([...open.map(pr => pr.repo), ...history.filter(pr => hadRecentActivity(pr, now)).map(pr => pr.repo)])
  return [...repos]
    .map(repo => ({
      repo,
      currentTicket: currentTicket(history, repo),
      queue: open.filter(pr => pr.repo === repo && isReadyForReview(pr)).sort(byCreatedAt).map(pr => toQueuedPr(pr, now)),
      attendants: rankLogins(reviewCounts(history, now, MONTH_MS, repo)),
      ...counterActivity(repo, open, history, now),
    }))
    .sort((a, b) => b.queue.length - a.queue.length || a.repo.localeCompare(b.repo))
}

export function buildWaitingRoom(open: OpenPr[], now: Date): QueuedPr[] {
  return open.filter(pr => !isReadyForReview(pr)).sort(byCreatedAt).map(pr => toQueuedPr(pr, now))
}

export function findOldest(counters: Counter[]): QueuedPr | null {
  return counters.flatMap(counter => counter.queue).sort(byCreatedAt)[0] ?? null
}
