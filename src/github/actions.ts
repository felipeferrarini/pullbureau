import type { RawActionRun } from '@/types/github'
import { GithubError, githubSignal } from './client'

export async function fetchActionRuns(token: string, org: string, repo: string, since: Date, fetchImpl: typeof fetch = fetch): Promise<RawActionRun[]> {
  const query = new URLSearchParams({ per_page: '100', created: `>=${since.toISOString()}` })
  const url = `https://api.github.com/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo)}/actions/runs?${query}`
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, cache: 'no-store', signal: githubSignal() })
  if (!response.ok) throw new GithubError(`actions runs responded ${response.status}`, response.status)
  return ((await response.json()) as { workflow_runs: RawActionRun[] }).workflow_runs
}

export function completedRunTimes(runs: RawActionRun[]): Map<string, string> {
  const times = new Map<string, string>()
  for (const run of runs) {
    if (run.status !== 'completed') continue
    const known = times.get(run.head_sha)
    if (!known || Date.parse(run.updated_at) > Date.parse(known)) times.set(run.head_sha, run.updated_at)
  }
  return times
}
