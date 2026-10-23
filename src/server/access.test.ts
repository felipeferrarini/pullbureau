import { describe, expect, it, vi } from 'vitest'
import { authorizeRequest, bypassAuth, createAccessCheck } from './access'

describe('createAccessCheck', () => {
  it('lets members in and keeps others out', async () => {
    const check = createAccessCheck(async login => login === 'example-user')
    await expect(check('example-user')).resolves.toBe(true)
    await expect(check('stranger')).resolves.toBe(false)
  })

  it('caches answers per login, case-insensitively', async () => {
    const isMember = vi.fn().mockResolvedValue(true)
    let now = 0
    const check = createAccessCheck(isMember, 1000, () => now)
    await check('Alice')
    await check('alice')
    expect(isMember).toHaveBeenCalledTimes(1)
    now = 2000
    await check('alice')
    expect(isMember).toHaveBeenCalledTimes(2)
  })

  it('denies and does not cache when github fails', async () => {
    const isMember = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(true)
    const check = createAccessCheck(isMember)
    await expect(check('alice')).resolves.toBe(false)
    await expect(check('alice')).resolves.toBe(true)
  })
})

describe('bypassAuth', () => {
  it('only bypasses for e2e outside vercel', () => {
    expect(bypassAuth({ E2E_BYPASS_AUTH: '1' }, 'localhost')).toBe(true)
    expect(bypassAuth({ E2E_BYPASS_AUTH: '1', VERCEL: '1' })).toBe(false)
    expect(bypassAuth({})).toBe(false)
  })
})

describe('request authorization', () => {
  it('requires loopback even on unknown hosting platforms', () => {
    const env = { E2E_BYPASS_AUTH: '1', NODE_ENV: 'development' }
    expect(bypassAuth(env, 'example.com')).toBe(false)
    expect(bypassAuth(env)).toBe(false)
    expect(bypassAuth(env, '127.0.0.1')).toBe(true)
    expect(bypassAuth(env, '[::1]')).toBe(true)
    expect(bypassAuth({ ...env, NODE_ENV: 'production' }, 'localhost')).toBe(false)
  })
  it('never enables production or hosted bypass', () => {
    for (const host of ['VERCEL', 'NETLIFY', 'RENDER', 'FLY_APP_NAME']) {
      expect(bypassAuth({ E2E_BYPASS_AUTH: '1', [host]: '1' })).toBe(false)
    }
    expect(bypassAuth({ E2E_BYPASS_AUTH: '1', NODE_ENV: 'production' })).toBe(false)
  })
  it('requires a live session or explicit local test bypass', () => {
    expect(authorizeRequest('/api/state', false, {})).toBe(false)
    expect(authorizeRequest('/api/state', true, { NODE_ENV: 'production' })).toBe(true)
    expect(authorizeRequest('/api/state', false, { NODE_ENV: 'test', E2E_BYPASS_AUTH: '1' }, 'localhost')).toBe(true)
  })
  it('limits demo access to its fictional replay even with sessions and bypass', () => {
    const env = { DEMO_MODE: '1', NODE_ENV: 'production', E2E_BYPASS_AUTH: '1' }
    expect(authorizeRequest('/', false, env)).toBe(true)
    expect(authorizeRequest('/api/replay/demo', false, env)).toBe(true)
    for (const path of ['/api/state', '/api/pr/acme/repo/1', '/api/replay/private']) {
      expect(authorizeRequest(path, false, env)).toBe(false)
      expect(authorizeRequest(path, true, env)).toBe(false)
    }
  })
})
