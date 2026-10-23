import { READY_LABEL } from '@/shared/constants'
import type { CiState, HistoryPr, Message, OpenPr, PrRef, PrState, PrThread, Review, ReviewState } from '@/types/domain'
import type { RawComment, RawCommitNode, RawConnection, RawHistoryPr, RawOpenPr, RawPrState, RawReview, RawReviewState, RawReviewThread, RawRollup, RawThreadPr } from '@/types/github'
import { type BotFilter, loginOf } from './actors'

const CI_STATES: Record<string, CiState> = { SUCCESS: 'success', FAILURE: 'failure', ERROR: 'failure', PENDING: 'pending', EXPECTED: 'pending' }
const REVIEW_STATES: Partial<Record<RawReviewState, ReviewState>> = { APPROVED: 'approved', CHANGES_REQUESTED: 'changes_requested', COMMENTED: 'commented' }
const PR_STATES: Record<RawPrState, PrState> = { OPEN: 'open', MERGED: 'merged', CLOSED: 'closed' }

const byAt = (a: { at: string }, b: { at: string }) => Date.parse(a.at) - Date.parse(b.at)
const items = <T>(connection: RawConnection<T>): T[] => (connection?.nodes ?? []).filter((node): node is T => node != null)

type RawRefSource = { number: number; title: string; url: string; repository: { name: string }; author: RawOpenPr['author'] }

function toRef(raw: RawRefSource): PrRef {
  return { repo: raw.repository.name, number: raw.number, title: raw.title, url: raw.url, author: loginOf(raw.author) }
}

function toReviews(connection: RawConnection<RawReview>, isBot: BotFilter): Review[] {
  return items(connection)
    .filter(review => !isBot(review.author) && review.submittedAt && REVIEW_STATES[review.state])
    .map(review => ({ reviewer: loginOf(review.author), state: REVIEW_STATES[review.state] as ReviewState, at: review.submittedAt as string }))
    .sort(byAt)
}

function toMessage(comment: RawComment, threadId: string | null): Message {
  return { author: loginOf(comment.author), at: comment.createdAt, body: comment.body, threadId }
}

function toMessages(comments: RawConnection<RawComment>, threads: RawConnection<RawReviewThread>, isBot: BotFilter): Message[] {
  const human = (comment: RawComment) => !isBot(comment.author)
  return [
    ...items(comments).filter(human).map(comment => toMessage(comment, null)),
    ...items(threads).flatMap(thread => items(thread.comments).filter(human).map(comment => toMessage(comment, thread.id))),
  ].sort(byAt)
}

type RawCommit = RawCommitNode['commit']

function toCi(commit: RawCommit | undefined, ciTimes: Map<string, string>): { ci: CiState; ciAt: string | null } {
  const rollup: RawRollup | undefined = commit?.statusCheckRollup
  if (!commit || !rollup) return { ci: 'none', ciAt: null }
  return { ci: CI_STATES[rollup.state] ?? 'none', ciAt: ciTimes.get(commit.oid) ?? null }
}

export function normalizeOpenPr(raw: RawOpenPr, isBot: BotFilter, ciTimes: Map<string, string> = new Map(), readyLabel = READY_LABEL): OpenPr {
  return {
    ...toRef(raw),
    authorIsBot: isBot(raw.author),
    createdAt: raw.createdAt,
    isDraft: raw.isDraft,
    isReady: !raw.isDraft && items(raw.labels ?? null).some(label => label.name === readyLabel),
    ...toCi(items(raw.commits)[0]?.commit, ciTimes),
    reviews: toReviews(raw.reviews, isBot),
    messages: toMessages(raw.comments, raw.reviewThreads, isBot),
  }
}

export function normalizeHistoryPr(raw: RawHistoryPr, isBot: BotFilter): HistoryPr {
  return {
    ...toRef(raw),
    authorIsBot: isBot(raw.author),
    state: PR_STATES[raw.state],
    createdAt: raw.createdAt,
    mergedAt: raw.mergedAt,
    closedAt: raw.closedAt,
    reviews: toReviews(raw.reviews, isBot),
  }
}

export function normalizeThread(raw: RawThreadPr, isBot: BotFilter): PrThread {
  return {
    ...toRef(raw),
    state: PR_STATES[raw.state],
    reviews: toReviews(raw.reviews, isBot),
    messages: toMessages(raw.comments, raw.reviewThreads, isBot),
  }
}
