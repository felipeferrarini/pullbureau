import type { SceneEvent, Snapshot } from '@/types/domain'

const longestQueue = (snapshot: Snapshot, hallCount: number) =>
  snapshot.counters.slice(0, hallCount).reduce<Snapshot['counters'][number] | null>((best, counter) => (!best || counter.queue.length > best.queue.length ? counter : best), null)

// A fake merge of the last PR in the longest line, for the `?egg=` triggers.
export function fakeMerge(snapshot: Snapshot, hallCount: number, queueJump: boolean, at: string): SceneEvent | null {
  const last = longestQueue(snapshot, hallCount)?.queue.at(-1)
  if (!last) return null
  return { kind: 'merged', at, queueJump, pr: { repo: last.repo, number: last.number, title: last.title, url: last.url, author: last.author } }
}
