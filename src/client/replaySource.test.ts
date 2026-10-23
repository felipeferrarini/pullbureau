import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PrThread, Snapshot } from '@/types/domain'
import type { ReplayFixture } from '@/types/replay'
import { createReplaySource } from './replaySource'

const snap = (generatedAt: string) => ({ generatedAt }) as Snapshot
const fixture: ReplayFixture = {
  snapshots: [snap('2026-10-15T13:00:00.000Z'), snap('2026-10-15T13:05:00.000Z')],
  threads: { 'api#412': { number: 412 } as PrThread },
}

describe('createReplaySource', () => {
  afterEach(() => vi.useRealTimers())

  it('emits snapshots as the accelerated clock passes them', () => {
    vi.useFakeTimers()
    let real = 0
    const source = createReplaySource(fixture, 10, () => real)
    const seen: string[] = []
    const stop = source.start(s => seen.push(s.generatedAt))
    expect(seen).toEqual(['2026-10-15T13:00:00.000Z'])
    real = 30_000
    vi.advanceTimersByTime(1000)
    expect(seen).toHaveLength(2)
    expect(source.now().toISOString()).toBe('2026-10-15T13:05:00.000Z')
    stop()
  })

  it('serves recorded threads', async () => {
    const source = createReplaySource(fixture, 1)
    await expect(source.getThread('api', 412)).resolves.toEqual({ number: 412 })
    await expect(source.getThread('api', 1)).resolves.toBeNull()
  })
})

describe('selectReplay', () => {
  it('forces the fictional fixture for every demo query', async () => {
    const { selectReplay } = await import('./replaySource')
    for (const query of ['', 'replay=private', 'replay=']) {
      expect(selectReplay(new URLSearchParams(query), '1')).toBe('demo')
    }
    expect(selectReplay(new URLSearchParams('replay=recorded'), undefined)).toBe('recorded')
    expect(selectReplay(new URLSearchParams(), undefined)).toBeNull()
  })
})
