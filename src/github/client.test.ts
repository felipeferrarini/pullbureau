import { describe, expect, it, vi } from 'vitest'
import { GithubError, createGraphql, searchAll } from './client'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('createGraphql', () => {
  it('posts the query with a bearer token', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: { ok: true } }))
    const gql = createGraphql('secret', fetchImpl as unknown as typeof fetch)
    await expect(gql('query { ok }', { a: 1 })).resolves.toEqual({ ok: true })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.github.com/graphql')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret')
    expect(JSON.parse(init.body as string)).toEqual({ query: 'query { ok }', variables: { a: 1 } })
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('retries transient 5xx responses before succeeding', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 504))
      .mockResolvedValueOnce(jsonResponse({}, 502))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }))
    const gql = createGraphql('t', fetchImpl as unknown as typeof fetch, [0, 0])
    await expect(gql('q')).resolves.toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('gives up after the last retry and does not retry client errors', async () => {
    const flaky = vi.fn(async () => jsonResponse({}, 504))
    await expect(createGraphql('t', flaky as unknown as typeof fetch, [0, 0])('q')).rejects.toMatchObject({ status: 504 })
    expect(flaky).toHaveBeenCalledTimes(3)
    const denied = vi.fn(async () => jsonResponse({}, 401))
    await expect(createGraphql('t', denied as unknown as typeof fetch, [0, 0])('q')).rejects.toMatchObject({ status: 401 })
    expect(denied).toHaveBeenCalledTimes(1)
  })

  it('throws GithubError on http and graphql errors', async () => {
    const http = createGraphql('t', (async () => jsonResponse({}, 502)) as unknown as typeof fetch, [])
    await expect(http('q')).rejects.toMatchObject({ name: 'GithubError', status: 502 })
    const gqlError = createGraphql('t', (async () => jsonResponse({ errors: [{ message: 'boom' }] })) as unknown as typeof fetch)
    await expect(gqlError('q')).rejects.toThrow(GithubError)
  })

  it('returns partial data and warns when graphql reports errors alongside data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const gql = createGraphql('t', (async () => jsonResponse({ data: { ok: 1 }, errors: [{ message: 'Resource not accessible by personal access token' }] })) as unknown as typeof fetch)
    await expect(gql('q')).resolves.toEqual({ ok: 1 })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Resource not accessible'))
    warn.mockRestore()
  })
})

describe('searchAll', () => {
  it('follows cursors until the last page', async () => {
    const gql = vi.fn()
      .mockResolvedValueOnce({ search: { pageInfo: { hasNextPage: true, endCursor: 'c1' }, nodes: [{ number: 1 }] } })
      .mockResolvedValueOnce({ search: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ number: 2 }, {}] } })
    const nodes = await searchAll<{ number: number }>(gql, 'Q', 'org:x')
    expect(nodes).toEqual([{ number: 1 }, { number: 2 }])
    expect(gql).toHaveBeenNthCalledWith(2, 'Q', { q: 'org:x', after: 'c1' })
  })

  it('drops null nodes left by partial graphql errors', async () => {
    const gql = vi.fn().mockResolvedValue({ search: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [null, { number: 3 }] } })
    await expect(searchAll<{ number: number }>(gql, 'Q', 'q')).resolves.toEqual([{ number: 3 }])
  })

  it('stops at maxPages', async () => {
    const gql = vi.fn().mockResolvedValue({ search: { pageInfo: { hasNextPage: true, endCursor: 'c' }, nodes: [{ number: 1 }] } })
    await searchAll(gql, 'Q', 'q', 2)
    expect(gql).toHaveBeenCalledTimes(2)
  })
})
