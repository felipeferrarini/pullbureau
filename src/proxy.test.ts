import { describe, expect, it, vi } from 'vitest'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
import { config } from './proxy'

describe('proxy matcher', () => {
  const matches = (url: string) => unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })
  it('serves rendering assets without authentication', () => {
    for (const asset of ['/CREDITS.md', '/hdri/day.hdr', '/models/person.glb', '/fonts/font.woff2', '/screenshots/en-scene.png']) {
      expect(matches(asset), asset).toBe(false)
    }
  })
  it('retains protection for all data APIs', () => {
    for (const api of ['/api/state', '/api/pr/repo/1', '/api/replay/private']) expect(matches(api)).toBe(true)
  })
})
