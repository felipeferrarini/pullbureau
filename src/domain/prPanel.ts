import { LOCALE, t } from '@/i18n'
import { TIME_ZONE } from '@/shared/constants'
import type { CiState, PrThread, QueuedPr, ReviewState } from '@/types/domain'
import type { AgeBadge, TimelineItem } from '@/types/prPanel'
import type { StampVariant } from '@/types/scene'
import { toExcerpt } from './excerpt'

export const TIMELINE_COMMENTS = 3
const COMMENT_EXCERPT = 160
const WARM_DAYS = 2
const HOT_DAYS = 7
const FOSSIL_DAYS = 30

const STAMP_FOR: Record<ReviewState, StampVariant> = { approved: 'approved', changes_requested: 'rejected', commented: 'review' }
export const STAMP_LABEL: Record<StampVariant, string> = { approved: t('stamp.approved'), rejected: t('stamp.rejected'), review: t('stamp.review') }
const CI_LABEL: Record<CiState, string> = { success: t('ci.success'), failure: t('ci.failure'), pending: t('ci.pending'), none: t('ci.none') }

const dateTime = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export const shortDateTime = (iso: string) => dateTime.format(new Date(iso)).replace(',', '')

export const ciLabel = (state: CiState) => CI_LABEL[state]

const daysLabel = (days: number) => (days === 0 ? t('age.today') : days === 1 ? t('age.day') : t('age.days', { count: days }))

export function ageBadge(ageDays: number): AgeBadge {
  const days = Math.max(0, Math.floor(ageDays))
  if (days >= FOSSIL_DAYS) return { level: 'fossil', label: t('age.fossil', { age: daysLabel(days) }) }
  return { level: days >= HOT_DAYS ? 'hot' : days >= WARM_DAYS ? 'warm' : 'fresh', label: daysLabel(days) }
}

const byTime = (a: { at: string }, b: { at: string }) => Date.parse(a.at) - Date.parse(b.at)

type TimedItem = Extract<TimelineItem, { at: string }>

function threadItems(thread: PrThread): TimedItem[] {
  const reviews: TimedItem[] = thread.reviews.map(review => ({
    kind: 'review',
    at: review.at,
    reviewer: review.reviewer,
    stamp: STAMP_FOR[review.state],
    label: STAMP_LABEL[STAMP_FOR[review.state]],
  }))
  const comments: TimedItem[] = [...thread.messages]
    .sort(byTime)
    .slice(-TIMELINE_COMMENTS)
    .map(message => ({ kind: 'comment', at: message.at, author: message.author, excerpt: toExcerpt(message.body, COMMENT_EXCERPT) }))
  return [...reviews, ...comments]
}

export function prTimeline(pr: QueuedPr, thread: PrThread | null): TimelineItem[] {
  const opened: TimelineItem = { kind: 'opened', at: pr.createdAt, author: pr.author }
  const middle = thread ? threadItems(thread).sort(byTime) : []
  return [opened, ...middle, { kind: 'ci', state: pr.ci, label: ciLabel(pr.ci) }]
}
