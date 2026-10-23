'use client'

import { t, LOCALE } from '@/i18n'


import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/client/store'
import { tickerItems } from '@/domain/hudStrip'
import { useReducedMotion } from '@/scene/render/useReducedMotion'
import { TIME_ZONE } from '@/shared/constants'
import type { SceneEvent } from '@/types/domain'
import type { TickerItem } from '@/types/hud'
import styles from './Ticker.module.css'

const TICKER_LIMIT = 20
const SECONDS_PER_CHAR = 0.17
const MIN_LOOP_S = 24
const ROTATE_MS = 6000
const CLOCK_MS = 15_000
const IDLE: TickerItem[] = [{ text: t('ui.noRecentActivityPleaseWaitToBeCalled'), tone: 'info' }]

const clockFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

function useClock(): string | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    const first = setTimeout(tick, 0)
    const timer = setInterval(tick, CLOCK_MS)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [])
  return now ? clockFormat.format(now) : null
}

function useRotation(count: number, enabled: boolean): number {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!enabled || count < 2) return
    const timer = setInterval(() => setIndex(value => value + 1), ROTATE_MS)
    return () => clearInterval(timer)
  }, [count, enabled])
  return count ? index % count : 0
}

function Items({ items, hidden }: { items: TickerItem[]; hidden?: boolean }) {
  return (
    <span className={styles.group} aria-hidden={hidden || undefined}>
      {items.map((item, index) => (
        <span key={index} className={styles.entry}>
          <span className={styles.item} data-tone={item.tone}>
            {item.text}
          </span>
          <span className={styles.sep} aria-hidden>
            ◆
          </span>
        </span>
      ))}
    </span>
  )
}

function Marquee({ items }: { items: TickerItem[] }) {
  const chars = items.reduce((sum, item) => sum + item.text.length + 4, 0)
  const duration = Math.max(MIN_LOOP_S, chars * SECONDS_PER_CHAR)
  return (
    <span className={styles.track} style={{ '--loop': `${duration}s` } as React.CSSProperties}>
      <Items items={items} />
      <Items items={items} hidden />
    </span>
  )
}

function Rotating({ items }: { items: TickerItem[] }) {
  const index = useRotation(items.length, true)
  const item = items[index]
  return (
    <span key={index} className={`${styles.item} ${styles.still}`} data-tone={item.tone}>
      {item.text}
    </span>
  )
}

export function Ticker({ events }: { events: SceneEvent[] }) {
  const notices = useAppStore(state => state.notices)
  const items = useMemo(() => {
    const list: TickerItem[] = [...notices, ...tickerItems(events, TICKER_LIMIT)]
    return list.length ? list : IDLE
  }, [events, notices])
  const reduced = useReducedMotion()
  const clock = useClock()
  return (
    <footer className={styles.ticker} data-keep-panel data-testid="ticker">
      <span className={styles.plate}>
        <span className={styles.led} aria-hidden />
        <span className={styles.plateText}>{t('ui.notices')}</span>
      </span>
      <div className={styles.screen} role="marquee" aria-label={t('ui.latestBureauEvents')} tabIndex={0}>
        {reduced ? <Rotating items={items} /> : <Marquee items={items} />}
      </div>
      {clock && (
        <span className={styles.clock} aria-label={t('ui.clock', { clock, timeZone: TIME_ZONE })}>
          {clock}
        </span>
      )}
    </footer>
  )
}
