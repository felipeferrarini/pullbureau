import { describe, expect, it } from 'vitest'
import { splitCounters } from '@/domain/activity'
import { noticeCards } from '@/domain/board'
import { buildDuelScript } from '@/domain/duel'
import { isBrawl } from '@/domain/queue'
import { prBirthdays } from '@/eggs/birthday'
import { DEMO_T0, buildDemoFixture } from './demoBuilder'

const fixture = buildDemoFixture()

describe('buildDemoFixture', () => {
  it('is deterministic', () => {
    expect(buildDemoFixture()).toEqual(fixture)
  })

  it('covers every event kind after the start', () => {
    const kinds = new Set(fixture.snapshots.flatMap(s => s.events).filter(e => Date.parse(e.at) > DEMO_T0).map(e => e.kind))
    expect([...kinds].sort()).toEqual(['ci', 'closed', 'comment', 'merged', 'pr_opened', 'review'])
  })

  it('starts on strike and ends it with the first review', () => {
    expect(fixture.snapshots.map(s => s.strike.active)).toEqual([true, false, false])
  })

  it('has a brawl that is still TO BE CONTINUED, with the blocker ahead', () => {
    const brawl = fixture.snapshots[0].counters.flatMap(c => c.queue).find(p => p.number === 412)
    expect(brawl && isBrawl(brawl)).toBe(true)
    expect(buildDuelScript(fixture.threads['api#412'])?.outcome).toEqual({ kind: 'to_be_continued', winner: 'erin' })
  })

  it('spills the api queue onto the sidewalk and has skeletons', () => {
    const hub = fixture.snapshots[0].counters.find(c => c.repo === 'api')
    expect(hub?.queue.length).toBeGreaterThan(15)
    expect(fixture.snapshots[0].counters.flatMap(c => c.queue).some(p => p.ageDays > 60)).toBe(true)
    expect(fixture.snapshots[0].waitingRoom.length).toBeGreaterThan(0)
  })

  it('has more counters than fit, with abandoned ones behind the closed toggle', () => {
    const first = fixture.snapshots[0]
    const split = splitCounters(first.counters, new Date(first.generatedAt))
    expect(first.counters.length).toBeGreaterThanOrEqual(12)
    expect(split.visible).toHaveLength(10)
    expect(split.closed.map(c => c.repo)).toEqual(expect.arrayContaining(['task-runner', 'review-tools', 'portal']))
    expect(split.closed.find(c => c.repo === 'portal')?.queue.length).toBeGreaterThan(0)
  })

  it('has a queue jump during the replay', () => {
    const jumps = fixture.snapshots.flatMap(s => s.events).filter(e => e.kind === 'merged' && e.queueJump && Date.parse(e.at) > DEMO_T0)
    expect(jumps.map(e => e.pr.number)).toEqual([451])
  })

  it('celebrates 1 and 2 month birthdays, one of them during the replay', () => {
    const birthdays = fixture.snapshots.map(s => prBirthdays(s.counters.flatMap(c => c.queue), new Date(s.generatedAt)))
    expect(birthdays[0].map(b => b.months)).toEqual(expect.arrayContaining([1, 2]))
    expect(birthdays[0].some(b => b.pr.number === 560)).toBe(false)
    expect(birthdays[1].some(b => b.pr.number === 560)).toBe(true)
  })

  it('ranks fictional reviewers deterministically, with the same top reviewer on the board and in the frame', () => {
    const first = fixture.snapshots[0]
    expect(noticeCards(first.board).slice(0, 4).map(card => card.login)).toEqual(['erin', 'alice', 'bob', 'dave'])
    expect(first.board.employeeOfTheMonth).toBe('erin')
    const [top, second, third] = first.board.ranking
    expect(top.reviews).toBeGreaterThan(second.reviews)
    expect(second.reviews).toBeGreaterThan(third.reviews * 1.5)
  })

  it('carries hud stats', () => {
    const first = fixture.snapshots[0]
    expect(first.stats.queueNow).toBeGreaterThan(40)
    expect(first.stats.medianFirstReviewHours30d).not.toBeNull()
    expect(first.stats.medianMergeHours30d).not.toBeNull()
    expect(first.stats.unreviewedCount).toBeGreaterThan(0)
  })
})
