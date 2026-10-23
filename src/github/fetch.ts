import type { RawHistoryPr, RawOpenPr, RawThreadPr } from '@/types/github'
import { GithubError, type Graphql, searchAll } from './client'
import { HISTORY_PRS_QUERY, OPEN_PRS_QUERY, PR_THREAD_QUERY } from './queries'

const day = (date: Date) => date.toISOString().slice(0, 10)

export function fetchOpenPrs(gql: Graphql, org: string): Promise<RawOpenPr[]> {
  return searchAll<RawOpenPr>(gql, OPEN_PRS_QUERY, `org:${org} is:pr is:open`)
}

export function fetchHistoryPrs(gql: Graphql, org: string, since: Date): Promise<RawHistoryPr[]> {
  return searchAll<RawHistoryPr>(gql, HISTORY_PRS_QUERY, `org:${org} is:pr updated:>=${day(since)}`, 10)
}

export async function fetchPrThread(gql: Graphql, org: string, repo: string, number: number): Promise<RawThreadPr | null> {
  try {
    const data = await gql<{ repository: { pullRequest: RawThreadPr | null } | null }>(PR_THREAD_QUERY, { owner: org, repo, number })
    return data.repository?.pullRequest ?? null
  } catch (error) {
    if (error instanceof GithubError && /could not resolve/i.test(error.message)) return null
    throw error
  }
}
