import { describe, expect, it } from 'vitest'
import { counter, queuedPr, snapshot } from '@/domain/testFactories'
import { fakeMerge } from './debugEvents'

describe('debug events', () => {
  it('fakes a merge of the last PR in the longest hall queue', () => {
    const snap = snapshot({
      counters: [
        counter({ repo: 'a', queue: [queuedPr({ repo: 'a', number: 1 })] }),
        counter({ repo: 'b', queue: [queuedPr({ repo: 'b', number: 2 }), queuedPr({ repo: 'b', number: 3, author: 'zé' })] }),
        counter({ repo: 'c', queue: [1, 2, 3, 4].map(n => queuedPr({ repo: 'c', number: n })) }),
      ],
    })
    const event = fakeMerge(snap, 2, true, 'now')
    expect(event).toMatchObject({ kind: 'merged', queueJump: true, pr: { repo: 'b', number: 3, author: 'zé' } })
  })

  it('has nothing to merge in an empty hall', () => {
    expect(fakeMerge(snapshot({ counters: [] }), 0, false, 'now')).toBeNull()
  })
})
