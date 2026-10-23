import { describe, expect, it } from 'vitest'
import { isOrgMember, listOrgMembers } from './membership'

const status = (code: number) => (async () => new Response(null, { status: code })) as unknown as typeof fetch

describe('isOrgMember', () => {
  it('maps 204 to true and 404/302 to false', async () => {
    await expect(isOrgMember('t', 'org', 'a', status(204))).resolves.toBe(true)
    await expect(isOrgMember('t', 'org', 'a', status(404))).resolves.toBe(false)
    await expect(isOrgMember('t', 'org', 'a', status(302))).resolves.toBe(false)
  })

  it('throws on unexpected statuses', async () => {
    await expect(isOrgMember('t', 'org', 'a', status(500))).rejects.toThrow('membership')
  })
})

describe('listOrgMembers', () => {
  it('paginates until a short page', async () => {
    const pages = [Array.from({ length: 100 }, (_, i) => ({ login: `u${i}` })), [{ login: 'last' }]]
    const fetchImpl = (async () => new Response(JSON.stringify(pages.shift()), { status: 200 })) as unknown as typeof fetch
    const members = await listOrgMembers('t', 'org', fetchImpl)
    expect(members).toHaveLength(101)
    expect(members.at(-1)).toBe('last')
  })
})

describe('membership requests', () => {
  it('give up on a slow github', async () => {
    const signals: unknown[] = []
    const fetchImpl = (async (url: string, init: RequestInit) => {
      signals.push(init.signal)
      return url.includes('/members/') ? new Response(null, { status: 204 }) : new Response('[]', { status: 200 })
    }) as unknown as typeof fetch
    await isOrgMember('t', 'org', 'a', fetchImpl)
    await listOrgMembers('t', 'org', fetchImpl)
    expect(signals).toHaveLength(2)
    expect(signals.every(signal => signal instanceof AbortSignal)).toBe(true)
  })
})
