import type { RawSearchPage } from '@/types/github'

export class GithubError extends Error {
  override name = 'GithubError'
  constructor(message: string, readonly status?: number) {
    super(message)
  }
}

// A hung GitHub call would hold every caller of the shared cache and block the stale fallback.
export const GITHUB_TIMEOUT_MS = 20_000
export const githubSignal = () => AbortSignal.timeout(GITHUB_TIMEOUT_MS)

export type Graphql = <T>(query: string, variables?: Record<string, unknown>) => Promise<T>

// GitHub's GraphQL gateway answers 502/503/504 now and then on heavy searches; a retry usually works.
export const RETRY_DELAYS_MS = [1000, 3000]
const isTransient = (status: number) => status >= 500

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function postWithRetry(post: () => Promise<Response>, delaysMs: number[]): Promise<Response> {
  for (const delay of delaysMs) {
    const response = await post()
    if (response.ok || !isTransient(response.status)) return response
    console.warn(`GitHub GraphQL responded ${response.status}, retrying in ${delay}ms`)
    await sleep(delay)
  }
  return post()
}

export function createGraphql(token: string, fetchImpl: typeof fetch = fetch, retryDelaysMs = RETRY_DELAYS_MS): Graphql {
  return async <T>(query: string, variables: Record<string, unknown> = {}) => {
    const post = () =>
      fetchImpl('https://api.github.com/graphql', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
        signal: githubSignal(),
      })
    const response = await postWithRetry(post, retryDelaysMs)
    if (!response.ok) throw new GithubError(`GitHub GraphQL responded ${response.status}`, response.status)
    const json = (await response.json()) as { data?: T; errors?: { message: string }[] }
    const errors = json.errors?.map(error => error.message).join('; ')
    if (json.data == null) throw new GithubError(errors || 'GitHub GraphQL returned no data')
    if (errors) console.warn(`GitHub GraphQL partial errors: ${errors}`)
    return json.data
  }
}

export async function searchAll<T extends { number?: number }>(gql: Graphql, query: string, q: string, maxPages = 5): Promise<T[]> {
  const nodes: T[] = []
  let after: string | null = null
  for (let page = 0; page < maxPages; page++) {
    const data: RawSearchPage<T> = await gql<RawSearchPage<T>>(query, { q, after })
    nodes.push(...data.search.nodes.filter((node): node is T => typeof node?.number === 'number'))
    if (!data.search.pageInfo.hasNextPage) break
    after = data.search.pageInfo.endCursor
  }
  return nodes
}
