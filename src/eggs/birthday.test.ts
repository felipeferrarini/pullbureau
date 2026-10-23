import { describe, expect, it } from 'vitest'
import { NOW, counter, queuedPr } from '@/domain/testFactories'
import { customerId } from '@/scene/actors'
import { birthdayGuests, birthdayLine, birthdayMonths, isBirthdayToday, planBirthday, prBirthdays, standInGuest } from './birthday'

const createdDaysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString()

describe('birthdayMonths', () => {
  it('counts the months when the age crossed a multiple of 30 days in the last 24 hours', () => {
    expect(birthdayMonths({ createdAt: createdDaysAgo(30.5) }, NOW)).toBe(1)
    expect(birthdayMonths({ createdAt: createdDaysAgo(60.01) }, NOW)).toBe(2)
    expect(birthdayMonths({ createdAt: createdDaysAgo(31.1) }, NOW)).toBeNull()
    expect(birthdayMonths({ createdAt: createdDaysAgo(29.9) }, NOW)).toBeNull()
    expect(birthdayMonths({ createdAt: createdDaysAgo(0.5) }, NOW)).toBeNull()
  })

  it('exposes a per PR check', () => {
    expect(isBirthdayToday({ createdAt: createdDaysAgo(90.2) }, NOW)).toBe(true)
    expect(isBirthdayToday({ createdAt: createdDaysAgo(45) }, NOW)).toBe(false)
  })
})

describe('prBirthdays', () => {
  it('lists the PRs having a birthday with their month count', () => {
    const queue = [queuedPr({ number: 1, createdAt: createdDaysAgo(60.5) }), queuedPr({ number: 2, createdAt: createdDaysAgo(10) })]
    expect(prBirthdays(queue, NOW)).toEqual([{ pr: queue[0], months: 2 }])
  })
})

describe('birthdayLine', () => {
  it('congratulates in portuguese, singular and plural', () => {
    expect(birthdayLine({ repo: 'api', number: 412 }, 2)).toBe('Parabéns, api #412 faz 2 meses na fila 🎂')
    expect(birthdayLine({ repo: 'students', number: 3 }, 1)).toBe('Parabéns, students #3 faz 1 mês na fila 🎂')
  })
})

describe('birthday party', () => {
  const queue = (repo: string, ages: number[]) => ages.map((days, i) => queuedPr({ repo, number: i + 1, createdAt: createdDaysAgo(days), ageDays: Math.floor(days) }))

  it('finds the guests inside the hall with the neighbours who clap', () => {
    const counters = [counter({ repo: 'a', queue: queue('a', [3, 60.4, 2]) }), counter({ repo: 'b', queue: queue('b', [30.2]) })]
    expect(birthdayGuests(counters, 1, NOW)).toEqual([
      { actorId: customerId('a', 2), repo: 'a', number: 2, months: 2, neighbours: [customerId('a', 1), customerId('a', 3)], speaker: customerId('a', 1) },
    ])
  })

  it('lets a lonely guest congratulate themselves', () => {
    const [guest] = birthdayGuests([counter({ repo: 'a', queue: queue('a', [30.1]) })], 1, NOW)
    expect(guest.neighbours).toEqual([])
    expect(guest.speaker).toBe(guest.actorId)
  })

  it('picks a stand-in from the longest line for the debug trigger', () => {
    const counters = [counter({ repo: 'a', queue: queue('a', [3]) }), counter({ repo: 'b', queue: queue('b', [5, 75, 1]) })]
    expect(standInGuest(counters, 2)).toMatchObject({ actorId: customerId('b', 2), months: 3 })
    expect(standInGuest([], 0)).toBeNull()
  })

  it('plays a bubble, a party horn and a short clap', () => {
    const guest = standInGuest([counter({ repo: 'b', queue: queue('b', [5, 61, 1]) })], 1)!
    const plan = planBirthday(guest, 'now')
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'bubble', actorId: customerId('b', 1), text: 'Parabéns, b #2 faz 2 meses na fila 🎂' }))
    expect(plan.effects).toContainEqual(expect.objectContaining({ kind: 'sound', sound: 'partyHorn' }))
    expect(plan.overrides.filter(o => o.anim === 'victory').map(o => o.actorId)).toEqual(guest.neighbours)
  })

  it('can wait its turn so parties do not talk over each other', () => {
    const guest = standInGuest([counter({ repo: 'b', queue: queue('b', [5, 61, 1]) })], 1)!
    const plan = planBirthday(guest, 'now', 6000)
    expect(plan.effects.every(effect => effect.at >= 6000)).toBe(true)
    expect(plan.duration).toBeGreaterThan(6000)
  })
})
