import type { HistoryPr, StrikeState } from '@/types/domain'
import { HOUR_MS, businessMsBetween } from './time'

export const STRIKE_AFTER_MS = 4 * HOUR_MS

export function lastReviewAt(history: HistoryPr[]): string | null {
  const times = history.flatMap(pr => pr.reviews.map(review => review.at)).sort((a, b) => Date.parse(a) - Date.parse(b))
  return times.at(-1) ?? null
}

export function buildStrike(history: HistoryPr[], now: Date): StrikeState {
  const last = lastReviewAt(history)
  if (!last) return { active: true, since: null }
  const idle = businessMsBetween(last, now, STRIKE_AFTER_MS)
  return idle >= STRIKE_AFTER_MS ? { active: true, since: last } : { active: false, since: null }
}
