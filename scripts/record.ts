import { writeFileSync } from 'node:fs'
import { isBrawl } from '@/domain/queue'
import { getState, getThread } from '@/server/state'
import { type ReplayFixture, threadKey } from '@/types/replay'

const arg = (name: string, fallback: number) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > 0 ? Number(process.argv[index + 1]) : fallback
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  process.loadEnvFile('.env.local')
  const name = process.argv[2]
  if (!name?.startsWith('rec-')) throw new Error('usage: pnpm record rec-<name> [--count 5] [--interval 130]')
  const count = arg('count', 5)
  const intervalMs = arg('interval', 130) * 1000
  const fixture: ReplayFixture = { snapshots: [], threads: {} }
  for (let i = 0; i < count; i++) {
    const snapshot = await getState()
    fixture.snapshots.push(snapshot)
    for (const pr of snapshot.counters.flatMap(counter => counter.queue).filter(isBrawl)) {
      const key = threadKey(pr.repo, pr.number)
      if (!fixture.threads[key]) {
        const thread = await getThread(pr.repo, pr.number)
        if (thread) fixture.threads[key] = thread
      }
    }
    console.log(`snapshot ${i + 1}/${count}: ${snapshot.events.length} events`)
    if (i < count - 1) await sleep(intervalMs)
  }
  writeFileSync(`fixtures/${name}.json`, JSON.stringify(fixture))
  console.log(`saved fixtures/${name}.json`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
