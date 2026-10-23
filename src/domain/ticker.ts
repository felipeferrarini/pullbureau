import { t } from '@/i18n'
import type { PrRef, ReviewState, SceneEvent } from '@/types/domain'

const REVIEW_VERBS: Record<ReviewState, string> = { approved: t('review.approved'), changes_requested: t('review.changes_requested'), commented: t('review.commented') }

const label = (pr: PrRef) => `${pr.repo} #${pr.number}`

export function tickerLine(event: SceneEvent): string {
  switch (event.kind) {
    case 'pr_opened':
      return t('ticker.opened', { author: event.pr.author, pr: label(event.pr) })
    case 'review':
      return t('ticker.review', { reviewer: event.reviewer, verb: REVIEW_VERBS[event.state], pr: label(event.pr) })
    case 'comment':
      return t('ticker.comment', { author: event.author, pr: label(event.pr) })
    case 'ci':
      return t('ticker.ci', { result: t(event.result === 'failure' ? 'ticker.failed' : 'ticker.passed'), pr: label(event.pr) })
    case 'merged':
      return event.queueJump ? t('ticker.jump', { author: event.pr.author, pr: label(event.pr) }) : t('ticker.merged', { pr: label(event.pr) })
    case 'closed':
      return t('ticker.closed', { pr: label(event.pr) })
  }
}

export function tickerLines(events: SceneEvent[], limit: number): string[] {
  return [...events]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit)
    .map(tickerLine)
}
