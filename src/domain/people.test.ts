import { describe, expect, it } from 'vitest'
import { buildPeople, pickModel } from './people'
import { NOW, historyPr, openPr, review } from './testFactories'

describe('pickModel', () => {
  it('is stable per login and honours overrides', () => {
    const ids = ['a', 'b', 'c']
    expect(pickModel('example-user', ids, {})).toBe(pickModel('example-user', ids, {}))
    expect(pickModel('alice', ids, { alice: 'suit' })).toBe('suit')
    expect(pickModel('x', [], {})).toBe('none')
  })

  it('keeps models pinned by an override out of everyone else\'s draw', () => {
    const logins = Array.from({ length: 60 }, (_, i) => `dev-${i}`)
    expect(logins.map(login => pickModel(login, ['a', 'b', 'suit'], { alice: 'suit' }))).not.toContain('suit')
  })
})

describe('buildPeople', () => {
  const people = buildPeople({
    members: ['example-user', 'henry', 'grace'],
    open: [openPr({ author: 'jhowr' }), openPr({ author: 'ghost' })],
    history: [
      historyPr({ repo: 'students', author: 'carol', reviews: [review('henry', '2026-10-14T00:00:00Z'), review('henry', '2026-10-13T00:00:00Z')] }),
      historyPr({ repo: 'infra', author: 'carol', reviews: [review('henry', '2026-10-14T00:00:00Z')] }),
    ],
    now: NOW,
    modelIds: ['a', 'b'],
    overrides: {},
    excluded: ['GRACE'],
  })

  it('includes members and open PR authors, minus excluded logins and ghost', () => {
    expect(people.map(p => p.login)).toEqual(['example-user', 'henry', 'jhowr'])
  })

  it('sets home repo to where the person reviewed the most, or null', () => {
    expect(people.find(p => p.login === 'henry')?.homeRepo).toBe('students')
    expect(people.find(p => p.login === 'example-user')?.homeRepo).toBeNull()
  })

  it('uses the github avatar url', () => {
    expect(people[0].avatarUrl).toBe('https://github.com/example-user.png?size=96')
  })
})
