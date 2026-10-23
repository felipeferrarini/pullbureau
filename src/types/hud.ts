import type { PrKey } from './domain'

export type Tone = 'good' | 'warn' | 'bad' | 'neutral'
export type Trend = 'up' | 'down' | 'flat'
export type Duration = { value: string; unit: string }

export type QueueMetric = { now: number; before: number; delta: number; trend: Trend; tone: Tone }
export type FlowMetric = { inflow: number; outflow: number; balance: number; balanceLabel: string; tone: Tone }
export type UnreviewedMetric = { count: number; target: PrKey | null; tone: Tone }
export type OldestMetric = { key: PrKey; date: string; label: string; ageDays: number }
export type CiRedMetric = { pct: number | null; tone: Tone }
export type BrawlRef = PrKey & { title: string }

export type HudStrip = {
  queue: QueueMetric
  flow: FlowMetric
  firstReview: Duration | null
  merge: Duration | null
  unreviewed: UnreviewedMetric
  oldest: OldestMetric | null
  ciRed: CiRedMetric
  brawls: BrawlRef[]
}

export type TickerTone = 'info' | 'good' | 'alert'
export type TickerItem = { text: string; tone: TickerTone }
export type Notice = TickerItem & { id: string }
