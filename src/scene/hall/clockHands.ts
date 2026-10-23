import { localClock } from '@/domain/time'

export type ClockHands = { hour: number; minute: number; second: number }

const TURN = Math.PI * 2

// Clockwise angles from 12 o'clock, in radians, in the configured time zone.
export function clockHands(date: Date): ClockHands {
  const { hour, minute } = localClock(date)
  const second = date.getUTCSeconds() + date.getUTCMilliseconds() / 1000
  return {
    hour: (((hour % 12) + minute / 60) / 12) * TURN,
    minute: ((minute + second / 60) / 60) * TURN,
    second: (second / 60) * TURN,
  }
}
