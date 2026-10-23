import { describe, expect, it, vi } from 'vitest'
import { createTtlCache } from './ttlCache'

describe('createTtlCache', () => {
  it('serves fresh values within the ttl', async () => {
    let now = 0
    const cache = createTtlCache<number>(1000, () => now)
    const loader = vi.fn().mockResolvedValue(1)
    await cache(loader)
    now = 999
    await expect(cache(loader)).resolves.toEqual({ value: 1, stale: false })
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('reloads after the ttl and dedupes concurrent loads', async () => {
    let now = 0
    const cache = createTtlCache<number>(1000, () => now)
    await cache(async () => 1)
    now = 1001
    const loader = vi.fn().mockResolvedValue(2)
    const [a, b] = await Promise.all([cache(loader), cache(loader)])
    expect(a.value).toBe(2)
    expect(b.value).toBe(2)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('falls back to the last good value as stale when loading fails', async () => {
    let now = 0
    const cache = createTtlCache<number>(1000, () => now)
    await cache(async () => 1)
    now = 5000
    await expect(cache(async () => { throw new Error('down') })).resolves.toEqual({ value: 1, stale: true })
  })

  it('rethrows when there is nothing to fall back to', async () => {
    const cache = createTtlCache<number>(1000, () => 0)
    await expect(cache(async () => { throw new Error('down') })).rejects.toThrow('down')
  })
})
