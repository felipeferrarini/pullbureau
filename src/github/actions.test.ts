import { describe, expect, it, vi } from 'vitest'
import type { RawActionRun } from '@/types/github'
import { completedRunTimes, fetchActionRuns } from './actions'

const run = (head_sha: string, updated_at: string, status = 'completed', conclusion: string | null = 'success'): RawActionRun =>
  ({ head_sha, status, conclusion, updated_at, pull_requests: [] })

describe('fetchActionRuns', () => {
  it('asks for the runs created since the given instant and returns them', async () => {
    const runs = [run('abc', '2026-10-15T10:00:00Z')]
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ total_count: 1, workflow_runs: runs }), { status: 200 }))
    const result = await fetchActionRuns('t', 'acme', 'api', new Date('2026-10-14T15:00:00Z'), fetchImpl as unknown as typeof fetch)
    expect(result).toEqual(runs)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.github.com/repos/acme/api/actions/runs?per_page=100&created=%3E%3D2026-10-14T15%3A00%3A00.000Z')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('throws on http errors', async () => {
    const fetchImpl = (async () => new Response('{}', { status: 403 })) as unknown as typeof fetch
    await expect(fetchActionRuns('t', 'o', 'r', new Date(), fetchImpl)).rejects.toMatchObject({ name: 'GithubError', status: 403 })
  })
})

describe('completedRunTimes', () => {
  it('maps each sha to the latest completed run time', () => {
    const times = completedRunTimes([
      run('abc', '2026-10-15T10:00:00Z'),
      run('abc', '2026-10-15T12:00:00Z', 'completed', 'failure'),
      run('abc', '2026-10-15T13:00:00Z', 'in_progress', null),
      run('def', '2026-10-15T09:00:00Z', 'queued', null),
    ])
    expect(times).toEqual(new Map([['abc', '2026-10-15T12:00:00Z']]))
  })
})
