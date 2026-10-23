import type { DataSource } from '@/types/client'
import { type ReplayFixture, threadKey } from '@/types/replay'

export const DEFAULT_REPLAY_SPEED = 10
const TICK_MS = 1000

export function createReplaySource(fixture: ReplayFixture, speed: number, clock: () => number = Date.now, tickMs = TICK_MS): DataSource {
  const startSim = Date.parse(fixture.snapshots[0]?.generatedAt ?? new Date(0).toISOString())
  const startReal = clock()
  const simNow = () => startSim + (clock() - startReal) * speed

  return {
    now: () => new Date(simNow()),
    start(onSnapshot) {
      let emitted = -1
      const tick = () => {
        const now = simNow()
        let next = emitted
        while (next + 1 < fixture.snapshots.length && Date.parse(fixture.snapshots[next + 1].generatedAt) <= now) next++
        if (next > emitted) {
          emitted = next
          onSnapshot(fixture.snapshots[next])
        }
      }
      tick()
      const timer = setInterval(tick, tickMs)
      return () => clearInterval(timer)
    },
    getThread: async (repo, number) => fixture.threads[threadKey(repo, number)] ?? null,
  }
}

export function selectReplay(params: URLSearchParams, demoMode: string | undefined): string | null {
  return demoMode === '1' ? 'demo' : params.get('replay')
}
