'use client'

import { t, DISPLAY_NAME } from '@/i18n'
import { BUSINESS_DAY_HOURS, BUSINESS_HOURS_LABEL, DEPLOYMENT_TIME_ZONE } from '@/i18n/uiFormat'


import { useMemo, useState } from 'react'
import { useAppStore } from '@/client/store'
import { buildHudStrip, isClosedRepo } from '@/domain/hudStrip'
import type { PrKey, Snapshot } from '@/types/domain'
import type { Duration } from '@/types/hud'
import { HudControls } from './HudControls'
import { HudMetric, type TipHandler, type TipState } from './HudMetric'
import styles from './Hud.module.css'
import { AlertIcon, ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, Emblem, FlowIcon, HourglassIcon, MergeIcon, QueueIcon, ReviewIcon, TicketIcon } from './icons'

const HINTS = {
  queue: t('ui.openPrsExcludingDraftsAcrossAllQueuesTheArrowComparesTheQueueWith7DaysAgoRisingIsWorse'),
  flow: t('ui.last7DaysPrsEnteringTheQueuePrsLeavingItMergedOrClosedTheBalanceTurnsGreenWhenMoreLeaveThanArrive'),
  firstReview: t('ui.firstReviewHint', { hours: BUSINESS_HOURS_LABEL, timeZone: DEPLOYMENT_TIME_ZONE }),
  merge: t('ui.mergeHint', { dayHours: BUSINESS_DAY_HOURS }),
  unreviewed: t('ui.prsOpenForOverOneBusinessDayWithoutAHumanReviewClickToVisitTheOldest'),
  oldest: t('ui.theLongestOpenPrInTheBureauClickToMoveTheCameraToIt'),
  ci: t('ui.amongQueuedPrsWithCiHowManyHaveAFailingLatestRun'),
}

function focusPr(snapshot: Snapshot, key: PrKey) {
  const store = useAppStore.getState()
  if (!store.showClosed && isClosedRepo(snapshot, key.repo)) store.setShowClosed(true)
  store.focus(key.repo)
  store.select(key)
}

function DurationValue({ duration }: { duration: Duration | null }) {
  if (!duration) return <>—</>
  return (
    <>
      {duration.value}
      <small className={styles.unit}>{duration.unit}</small>
    </>
  )
}

function DemoPill() {
  return (
    <span className={styles.demoPill} data-testid="demo-pill" role="status" title={t('ui.recordedReplayAllDataIsFictional', { organization: DISPLAY_NAME })}>
      <span className={styles.demoDot} aria-hidden />
      <strong>{t('ui.demoMode')}</strong>
      <span className={styles.demoSep} aria-hidden>·</span>
      {t('ui.fictionalData')}
    </span>
  )
}

function Tooltip({ tip }: { tip: TipState }) {
  if (!tip) return null
  return (
    <div className={styles.tooltip} style={{ left: tip.x, top: tip.y, '--arrow-x': `${tip.arrow}px` } as React.CSSProperties} aria-hidden>
      {tip.text}
    </div>
  )
}

export function Hud({ snapshot }: { snapshot: Snapshot }) {
  const strip = useMemo(() => buildHudStrip(snapshot), [snapshot])
  const skipped = useAppStore(state => state.skipped)
  const replay = useAppStore(state => state.replay)
  const [tip, setTip] = useState<TipState>(null)
  const onTip: TipHandler = setTip
  const { queue, flow, unreviewed, oldest, ciRed } = strip
  const TrendIcon = queue.trend === 'down' ? ArrowDownIcon : ArrowUpIcon
  const unreviewedTarget = unreviewed.target

  return (
    <>
      <header className={styles.strip} data-keep-panel>
        <h1 className={styles.brand}>
          <Emblem />
          <span className={styles.brandText}>
            <span className={styles.brandTop}>{t('ui.technologyBureau')}</span>
            <span className={styles.brandBottom}>{t('ui.organization', { organization: DISPLAY_NAME })}</span>
          </span>
        </h1>
        <ul className={styles.metrics}>
          <HudMetric icon={<QueueIcon />} label={t('ui.inQueue')} hint={HINTS.queue} onTip={onTip}
            value={<span data-testid="hud-total">{queue.now}</span>}
            sub={
              <span data-tone={queue.tone} className={styles.trend}>
                {queue.trend === 'flat' ? t('ui.7DaysAgo') : <><TrendIcon size={12} />{Math.abs(queue.delta)} {t('ui.vs7Days')}</>}
              </span>
            }
          />
          <HudMetric icon={<FlowIcon />} label={t('ui.7dFlow')} hint={HINTS.flow} onTip={onTip}
            value={<>{flow.inflow}<small className={styles.unit}>{t('ui.arrived')}</small><span className={styles.times}>×</span>{flow.outflow}<small className={styles.unit}>{t('ui.left')}</small></>}
            sub={<span data-tone={flow.tone}>{t('ui.balance')} {flow.balanceLabel}</span>}
          />
          <HudMetric icon={<ReviewIcon />} label={t('ui.firstReview')} hint={HINTS.firstReview} onTip={onTip} value={<DurationValue duration={strip.firstReview} />} sub={t('ui.30dMedian')} />
          <HudMetric icon={<MergeIcon />} label={t('ui.timeToMerge')} hint={HINTS.merge} onTip={onTip} value={<DurationValue duration={strip.merge} />} sub={t('ui.30dMedian')} />
          <HudMetric icon={<HourglassIcon />} label={t('ui.unreviewed')} hint={HINTS.unreviewed} onTip={onTip} tone={unreviewed.tone}
            value={unreviewed.count}
            sub={unreviewed.target ? <span className={styles.go}>{t('ui.viewOldest')} <ArrowRightIcon size={11} /></span> : t('ui.allReviewed')}
            onActivate={unreviewedTarget ? () => focusPr(snapshot, unreviewedTarget) : undefined}
          />
          <HudMetric icon={<TicketIcon />} label={t('ui.oldestTicket')} hint={HINTS.oldest} onTip={onTip}
            value={oldest ? oldest.date : '—'}
            sub={oldest ? <span className={styles.go}>{oldest.label} <ArrowRightIcon size={11} /></span> : t('ui.emptyQueue')}
            onActivate={oldest ? () => focusPr(snapshot, oldest.key) : undefined}
          />
          <HudMetric icon={<AlertIcon />} label={t('ui.failingCi')} hint={HINTS.ci} onTip={onTip} tone={ciRed.tone}
            value={ciRed.pct === null ? '—' : <>{ciRed.pct}<small className={styles.unit}>%</small></>}
            sub={t('ui.ofPrsWithCi')}
          />
        </ul>
        {skipped > 0 && <span className={styles.skipped}>+{skipped} {t('ui.events')}</span>}
        {replay && <DemoPill />}
      </header>
      <Tooltip tip={tip} />
      <HudControls snapshot={snapshot} brawls={strip.brawls} />
    </>
  )
}
