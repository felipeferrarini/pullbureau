'use client'

import { t } from '@/i18n'
import { BEFORE_OPENING_LABEL, BUSINESS_HOURS_LABEL, DEPLOYMENT_TIME_ZONE } from '@/i18n/uiFormat'


import { useEffect, useState } from 'react'
import { useAppStore } from '@/client/store'
import { useReducedMotion } from '@/scene/render/useReducedMotion'
import { DOOR_OPEN_S } from '@/scene/walkIn/introTimeline'
import { useIntroStore } from '@/scene/walkIn/introStore'
import { playSound } from '@/sound/sfx'
import styles from './IntroOverlay.module.css'

const BANNER_S = 2.6
const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

function useSkipOnInput(active: boolean) {
  useEffect(() => {
    if (!active) return
    const skip = () => useIntroStore.getState().finish()
    SKIP_EVENTS.forEach(name => window.addEventListener(name, skip, { capture: true, passive: true }))
    return () => SKIP_EVENTS.forEach(name => window.removeEventListener(name, skip, { capture: true }))
  }, [active])
}

function useOpeningBanner(active: boolean, startedAt: number) {
  const [banner, setBanner] = useState(false)
  useEffect(() => {
    if (!active) return
    const elapsed = performance.now() - startedAt
    const show = window.setTimeout(() => {
      setBanner(true)
      if (useAppStore.getState().soundOn) playSound('chime')
    }, Math.max(0, DOOR_OPEN_S * 1000 - elapsed))
    const hide = window.setTimeout(() => setBanner(false), Math.max(0, (DOOR_OPEN_S + BANNER_S) * 1000 - elapsed))
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [active, startedAt])
  return banner && active
}

function useFirstLoadFade(reduced: boolean) {
  const [fade] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('intro') !== '0')
  return reduced && fade
}

export function IntroOverlay() {
  const playing = useIntroStore(state => state.status === 'playing')
  const startedAt = useIntroStore(state => state.startedAt)
  const reduced = useReducedMotion()
  const fade = useFirstLoadFade(reduced)
  const banner = useOpeningBanner(playing, startedAt)
  useSkipOnInput(playing)

  if (fade) return <div className={styles.fade} aria-hidden />
  if (!playing) return null
  return (
    <div className={styles.overlay}>
      <div className={styles.barTop}>
        <span className={styles.caption}>{t('ui.beforeOpeningCaption', { time: BEFORE_OPENING_LABEL, timeZone: DEPLOYMENT_TIME_ZONE })}</span>
      </div>
      {banner && (
        <div className={styles.banner} role="status">
          <strong>{t('ui.open')}</strong>
          <span>{t('ui.openingHoursBanner', { hours: BUSINESS_HOURS_LABEL })}</span>
        </div>
      )}
      <div className={styles.barBottom}>
        <button type="button" className={styles.skip} onClick={() => useIntroStore.getState().finish()}>
          {t('ui.skipIntro')} <span aria-hidden>›</span>
        </button>
      </div>
    </div>
  )
}
