export type RawActorType = 'User' | 'Bot' | 'Mannequin' | 'Organization' | 'EnterpriseUserAccount'
export type RawActor = { __typename: RawActorType; login: string } | null

export type RawReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'
export type RawReview = { author: RawActor; state: RawReviewState; submittedAt: string | null; body: string }
export type RawComment = { author: RawActor; createdAt: string; body: string }
// Partial GraphQL errors can null out any connection or item, so raw data keeps them nullable.
export type RawConnection<T> = { nodes: (T | null)[] | null } | null

export type RawReviewThread = { id: string; comments: RawConnection<RawComment> }

export type RawRollup = { state: string } | null
export type RawCommitNode = { commit: { oid: string; statusCheckRollup: RawRollup } }

export type RawActionRun = {
  head_sha: string
  status: string
  conclusion: string | null
  updated_at: string
  pull_requests: { number: number }[]
}

type RawPrBase = {
  number: number
  title: string
  url: string
  createdAt: string
  repository: { name: string }
  author: RawActor
}

export type RawOpenPr = RawPrBase & {
  isDraft: boolean
  labels?: RawConnection<{ name: string }>
  reviews: RawConnection<RawReview>
  comments: RawConnection<RawComment>
  reviewThreads: RawConnection<RawReviewThread>
  commits: RawConnection<RawCommitNode>
}

export type RawPrState = 'OPEN' | 'MERGED' | 'CLOSED'

export type RawHistoryPr = RawPrBase & {
  state: RawPrState
  mergedAt: string | null
  closedAt: string | null
  reviews: RawConnection<RawReview>
}

export type RawThreadPr = RawPrBase & {
  state: RawPrState
  reviews: RawConnection<RawReview>
  comments: RawConnection<RawComment>
  reviewThreads: RawConnection<RawReviewThread>
}

export type RawSearchPage<T> = {
  search: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: (T | null)[] }
}
