import { BUSINESS_END_HOUR, BUSINESS_START_HOUR } from '@/shared/constants'
import { LOCALE, t } from '@/i18n'
import { formatDate } from '@/shared/format'
import type { HudStats, SceneEvent, Snapshot } from '@/types/domain'
import type { BrawlRef, CiRedMetric, Duration, FlowMetric, HudStrip, OldestMetric, QueueMetric, TickerItem, TickerTone, Tone, UnreviewedMetric } from '@/types/hud'
import { splitCounters } from './activity'
import { isBrawl } from './queue'
import { tickerLine } from './ticker'

export const BUSINESS_DAY_HOURS = BUSINESS_END_HOUR - BUSINESS_START_HOUR
const CI_RED_OK_PCT = 10
const CI_RED_BAD_PCT = 30

const decimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 })

export function businessDuration(hours: number | null): Duration | null {
  if (hours === null) return null
  if (hours < 1) return { value: '< 1', unit: t('duration.hour') }
  if (hours < BUSINESS_DAY_HOURS) return { value: decimal.format(hours), unit: hours < 2 ? t('duration.hour') : t('duration.hours') }
  const days = Math.round((hours / BUSINESS_DAY_HOURS) * 10) / 10
  return { value: decimal.format(days), unit: days < 2 ? t('duration.day') : t('duration.days') }
}

export const signed = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0')

function queueMetric(stats: HudStats): QueueMetric {
  const delta = stats.queueNow - stats.queue7dAgo
  const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const tone: Tone = trend === 'up' ? 'bad' : trend === 'down' ? 'good' : 'neutral'
  return { now: stats.queueNow, before: stats.queue7dAgo, delta, trend, tone }
}

function flowMetric(stats: HudStats): FlowMetric {
  const balance = stats.outflow7d - stats.inflow7d
  return { inflow: stats.inflow7d, outflow: stats.outflow7d, balance, balanceLabel: signed(balance), tone: balance >= 0 ? 'good' : 'bad' }
}

function unreviewedMetric(stats: HudStats): UnreviewedMetric {
  return { count: stats.unreviewedCount, target: stats.oldestUnreviewed, tone: stats.unreviewedCount > 0 ? 'warn' : 'good' }
}

function oldestMetric(snapshot: Snapshot): OldestMetric | null {
  const pr = snapshot.oldestPr
  if (!pr) return null
  return { key: { repo: pr.repo, number: pr.number }, date: formatDate(pr.createdAt), label: `${pr.repo} #${pr.number}`, ageDays: pr.ageDays }
}

function ciRedMetric(pct: number | null): CiRedMetric {
  if (pct === null) return { pct, tone: 'neutral' }
  return { pct, tone: pct <= CI_RED_OK_PCT ? 'good' : pct >= CI_RED_BAD_PCT ? 'bad' : 'warn' }
}

export function brawlsOf(snapshot: Snapshot): BrawlRef[] {
  return snapshot.counters.flatMap(counter => counter.queue.filter(isBrawl).map(pr => ({ repo: pr.repo, number: pr.number, title: pr.title })))
}

export function buildHudStrip(snapshot: Snapshot): HudStrip {
  const { stats } = snapshot
  return {
    queue: queueMetric(stats),
    flow: flowMetric(stats),
    firstReview: businessDuration(stats.medianFirstReviewHours30d),
    merge: businessDuration(stats.medianMergeHours30d),
    unreviewed: unreviewedMetric(stats),
    oldest: oldestMetric(snapshot),
    ciRed: ciRedMetric(stats.ciRedPct),
    brawls: brawlsOf(snapshot),
  }
}

function tickerTone(event: SceneEvent): TickerTone {
  switch (event.kind) {
    case 'review':
      return event.state === 'approved' ? 'good' : event.state === 'changes_requested' ? 'alert' : 'info'
    case 'ci':
      return event.result === 'failure' ? 'alert' : 'good'
    case 'merged':
      return event.queueJump ? 'alert' : 'good'
    default:
      return 'info'
  }
}

export function tickerItems(events: SceneEvent[], limit: number): TickerItem[] {
  return [...events]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit)
    .map(event => ({ text: tickerLine(event), tone: tickerTone(event) }))
}

export function isClosedRepo(snapshot: Snapshot, repo: string): boolean {
  return splitCounters(snapshot.counters, new Date(snapshot.generatedAt)).closed.some(counter => counter.repo === repo)
}
