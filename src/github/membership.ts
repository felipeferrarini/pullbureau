import { GithubError, githubSignal } from './client'

const headers = (token: string) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' })

export async function isOrgMember(token: string, org: string, login: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/members/${encodeURIComponent(login)}`
  const response = await fetchImpl(url, { headers: headers(token), redirect: 'manual', cache: 'no-store', signal: githubSignal() })
  if (response.status === 204) return true
  if (response.status === 404 || response.status === 302) return false
  throw new GithubError(`membership check responded ${response.status}`, response.status)
}

export async function listOrgMembers(token: string, org: string, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  const members: string[] = []
  for (let page = 1; page <= 10; page++) {
    const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/members?per_page=100&page=${page}`
    const response = await fetchImpl(url, { headers: headers(token), cache: 'no-store', signal: githubSignal() })
    if (!response.ok) throw new GithubError(`members list responded ${response.status}`, response.status)
    const batch = (await response.json()) as { login: string }[]
    members.push(...batch.map(member => member.login))
    if (batch.length < 100) break
  }
  return members
}
