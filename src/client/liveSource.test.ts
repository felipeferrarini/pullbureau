import { describe, expect, it, vi } from 'vitest'
import { SourceError, createLiveSource } from './liveSource'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('createLiveSource', () => {
  it('fetches the state immediately and hands it over', async () => {
    const fetchImpl = vi.fn(async () => json({ generatedAt: 'g' }))
    const onSnapshot = vi.fn()
    const stop = createLiveSource(fetchImpl as unknown as typeof fetch, 1e9).start(onSnapshot)
    await vi.waitFor(() => expect(onSnapshot).toHaveBeenCalledWith({ generatedAt: 'g' }))
    stop()
  })

  it('reports http failures with their status', async () => {
    const onError = vi.fn()
    const stop = createLiveSource((async () => json({}, 401)) as unknown as typeof fetch, 1e9).start(vi.fn(), onError)
    await vi.waitFor(() => expect(onError).toHaveBeenCalled())
    expect(onError.mock.calls[0][0]).toBeInstanceOf(SourceError)
    expect(onError.mock.calls[0][0].status).toBe(401)
    stop()
  })

  it('returns null for missing threads', async () => {
    const source = createLiveSource((async () => json({}, 404)) as unknown as typeof fetch)
    await expect(source.getThread('r', 1)).resolves.toBeNull()
  })
})
