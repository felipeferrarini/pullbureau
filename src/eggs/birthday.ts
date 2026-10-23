import { t } from '@/i18n'
import { DAY_MS, MONTH_MS } from '@/domain/time'
import { customerId } from '@/scene/actors'
import { MAX_INSIDE } from '@/scene/layout'
import type { Counter, PrKey } from '@/types/domain'
import type { Birthday, BirthdayGuest } from '@/types/eggs'
import type { Plan } from '@/types/scene'

export function birthdayMonths(pr: { createdAt: string }, now: Date): number | null {
  const age = now.getTime() - Date.parse(pr.createdAt)
  const months = Math.floor(age / MONTH_MS)
  return months >= 1 && age - months * MONTH_MS < DAY_MS ? months : null
}

export const isBirthdayToday = (pr: { createdAt: string }, now: Date) => birthdayMonths(pr, now) !== null

export function prBirthdays<T extends { createdAt: string }>(queue: T[], now: Date): Birthday<T>[] {
  return queue.flatMap(pr => {
    const months = birthdayMonths(pr, now)
    return months === null ? [] : [{ pr, months }]
  })
}

export const birthdayLine = (pr: PrKey, months: number) =>
  t('birthday.line', { pr: `${pr.repo} #${pr.number}`, count: months, unit: t(months === 1 ? 'birthday.month' : 'birthday.months') })

const PARTY_MS = 4800
const CLAP_AT = 400
const CLAP_MS = 2600
const DAYS_PER_MONTH = MONTH_MS / DAY_MS

function guestAt(counter: Counter, slot: number, months: number): BirthdayGuest {
  const pr = counter.queue[slot]
  const neighbours = [slot - 1, slot + 1].filter(i => i >= 0 && i < Math.min(counter.queue.length, MAX_INSIDE)).map(i => customerId(counter.repo, counter.queue[i].number))
  const actorId = customerId(pr.repo, pr.number)
  return { actorId, repo: pr.repo, number: pr.number, months, neighbours, speaker: neighbours[0] ?? actorId }
}

// Birthday PRs standing inside the hall, with the neighbours who clap for them.
export function birthdayGuests(counters: Counter[], hallCount: number, now: Date): BirthdayGuest[] {
  return counters.slice(0, hallCount).flatMap(counter =>
    counter.queue.slice(0, MAX_INSIDE).flatMap((pr, slot) => {
      const months = birthdayMonths(pr, now)
      return months === null ? [] : [guestAt(counter, slot, months)]
    }),
  )
}

// For `?egg=aniversario` on a day without birthdays: the second person of the longest line pretends.
export function standInGuest(counters: Counter[], hallCount: number): BirthdayGuest | null {
  const counter = counters.slice(0, hallCount).reduce<Counter | null>((best, c) => (!best || c.queue.length > best.queue.length ? c : best), null)
  if (!counter?.queue.length) return null
  const slot = Math.min(1, counter.queue.length - 1)
  return guestAt(counter, slot, Math.max(1, Math.round(counter.queue[slot].ageDays / DAYS_PER_MONTH)))
}

export const PARTY_STAGGER_MS = 6000
export const MAX_PARTIES = 3

export function planBirthday(guest: BirthdayGuest, at: string, delay = 0): Plan {
  return {
    id: `egg:birthday:${guest.actorId}:${at}`,
    repo: null,
    duration: delay + PARTY_MS,
    overrides: guest.neighbours.flatMap(actorId => [
      { actorId, at: delay + CLAP_AT, anim: 'victory' as const },
      { actorId, at: delay + CLAP_AT + CLAP_MS },
    ]),
    effects: [
      { kind: 'bubble', actorId: guest.speaker, text: birthdayLine(guest, guest.months), at: delay, duration: PARTY_MS - 300 },
      { kind: 'sound', sound: 'partyHorn', at: delay, duration: 0 },
    ],
    spawns: [],
  }
}
