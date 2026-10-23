import type { HistoryPr, PrRef, Review } from '@/types/domain'
import { isWithin } from './time'

export function reviewCounts(history: HistoryPr[], now: Date, windowMs: number, repo?: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const pr of history) {
    if (repo && pr.repo !== repo) continue
    for (const review of pr.reviews) {
      if (review.reviewer === pr.author || !isWithin(review.at, now, windowMs)) continue
      counts.set(review.reviewer, (counts.get(review.reviewer) ?? 0) + 1)
    }
  }
  return counts
}

export function rankLogins(counts: Map<string, number>): string[] {
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .map(([login]) => login)
}

export const humanReviews = (pr: Pick<PrRef, 'author'> & { reviews: Review[] }) => pr.reviews.filter(review => review.reviewer !== pr.author)

export const hasHumanReview = (pr: Pick<PrRef, 'author'> & { reviews: Review[] }) => humanReviews(pr).length > 0

export const isQueueJump = (pr: HistoryPr) => pr.state === 'merged' && !hasHumanReview(pr)
