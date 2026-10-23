import { t } from '@/i18n'
import { HOUR_MS } from '@/domain/time'
import { customerId, poseForAge } from '@/scene/actors'
import { COUNTER_SPACING, COUNTER_Z, MAX_INSIDE, counterX } from '@/scene/layout'
import { hashString } from '@/shared/hash'
import type { Counter } from '@/types/domain'
import type { SignPaint, StrikeBanner, StrikeCast, StrikeSign } from '@/types/eggs'
import type { Plan } from '@/types/scene'

export const SLOGANS = Array.from({ length: 6 }, (_, i) => t(`strike.${i}`))
export const SIGN_PAINTS: SignPaint[] = [
  { board: '#c49a64', ink: '#1f1a16' },
  { board: '#f2c230', ink: '#1f1a16' },
  { board: '#cf3f3a', ink: '#fff6e6' },
  { board: '#4c9a5b', ink: '#fffbea' },
]
export const SIGN_EVERY = 3
export const STRIKE_END_MS = 6000

const MAX_TILT = 0.16
const HOURS_BEFORE_DAYS = 48

export const sloganFor = (actorId: string) => SLOGANS[hashString(actorId) % SLOGANS.length]

export const strikeEnded = (previous: boolean, current: boolean) => previous && !current

export const holdsSign = (slot: number, ageDays: number) => slot % SIGN_EVERY === 1 && slot < MAX_INSIDE && poseForAge(ageDays) !== 'skeleton' && poseForAge(ageDays) !== 'sleeping'

function signFor(actorId: string): StrikeSign {
  const hash = hashString(actorId)
  return {
    slogan: sloganFor(actorId),
    paint: SIGN_PAINTS[(hash >>> 4) % SIGN_PAINTS.length],
    phase: ((hash >>> 8) % 628) / 100,
    tilt: (((hash >>> 16) % 200) / 100 - 1) * MAX_TILT,
  }
}

const DIVIDER_OFFSET = COUNTER_SPACING / 2

// The bedsheet banner is tied to the booth dividers of the two busiest neighbouring counters.
export function strikeBanner(counters: Counter[], hallCount: number): StrikeBanner | null {
  const count = Math.min(hallCount, counters.length)
  if (count < 1) return null
  let first = 0
  let best = -1
  for (let i = 0; i + 1 < count; i++) {
    const size = counters[i].queue.length + counters[i + 1].queue.length
    if (size > best) [first, best] = [i, size]
  }
  const last = Math.min(first + 1, count - 1)
  return { left: [counterX(first, hallCount) - DIVIDER_OFFSET, 0, COUNTER_Z], right: [counterX(last, hallCount) + DIVIDER_OFFSET, 0, COUNTER_Z] }
}

export function strikeCast(counters: Counter[], hallCount: number): StrikeCast {
  const signs = new Map<string, StrikeSign>()
  counters.slice(0, hallCount).forEach(counter =>
    counter.queue.forEach((pr, slot) => {
      const id = customerId(pr.repo, pr.number)
      if (holdsSign(slot, pr.ageDays)) signs.set(id, signFor(id))
    }),
  )
  return { signs, banner: strikeBanner(counters, hallCount) }
}

export function strikeBannerText(since: string | null, now: Date): string {
  if (!since) return t('strike.never')
  const hours = Math.max(1, Math.floor((now.getTime() - Date.parse(since)) / HOUR_MS))
  return hours < HOURS_BEFORE_DAYS ? t('strike.hours', { count: hours }) : t('strike.days', { count: Math.floor(hours / 24) })
}

export function planStrikeEnd(at: string): Plan {
  return {
    id: `egg:strike-end:${at}`,
    repo: null,
    duration: STRIKE_END_MS,
    overrides: [],
    spawns: [],
    effects: [
      { kind: 'banner', text: t('strike.end'), at: 0, duration: STRIKE_END_MS },
      { kind: 'sound', sound: 'fanfare', at: 0, duration: 0 },
    ],
  }
}
