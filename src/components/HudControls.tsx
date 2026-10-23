'use client'

import { t } from '@/i18n'


import { useAppStore } from '@/client/store'
import { useClosedCounters } from '@/client/useClosedCounters'
import type { Snapshot } from '@/types/domain'
import type { BrawlRef } from '@/types/hud'
import styles from './Hud.module.css'
import { useQualityStore } from '@/scene/render/quality'
import { QUALITIES, QUALITY_LABELS } from '@/scene/render/qualityTiers'
import { CameraIcon, CloseIcon, GaugeIcon, OverviewIcon, ShutterIcon, SoundOffIcon, SoundOnIcon } from './icons'

function Brawls({ brawls }: { brawls: BrawlRef[] }) {
  const openDuel = useAppStore(state => state.openDuel)
  if (!brawls.length) return null
  return (
    <aside className={styles.brawls} aria-label={t('ui.ongoingDuels')}>
      <h2 className={styles.brawlsTitle}>
        <span className={styles.led} aria-hidden />
        {t('ui.ongoingDuels')}
        <span className={styles.count}>{brawls.length}</span>
      </h2>
      <div className={styles.brawlList}>
        {brawls.map(brawl => (
          <button key={`${brawl.repo}#${brawl.number}`} type="button" className={styles.brawlButton} data-testid="brawl-button" title={brawl.title} onClick={() => openDuel(brawl)}>
            <span aria-hidden>🥊</span>
            {brawl.repo} <span className={styles.number}>#{brawl.number}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

function FollowingChip() {
  const following = useAppStore(state => state.following)
  const follow = useAppStore(state => state.follow)
  if (!following) return null
  return (
    <span className={styles.chip}>
      <CameraIcon size={14} />
      <span>
        {t('ui.following')} <strong>{following.repo} #{following.number}</strong>
      </span>
      <button type="button" className={styles.chipStop} onClick={() => follow(null)} aria-label={t('ui.stopFollowing')}>
        {t('ui.stop')} <CloseIcon size={11} />
      </button>
    </span>
  )
}

function QualityControl() {
  const quality = useQualityStore(state => state.quality)
  const setQuality = useQualityStore(state => state.setQuality)
  return (
    <div className={styles.quality} role="radiogroup" aria-label={t('ui.quality')} data-testid="quality-control">
      <GaugeIcon size={15} />
      <span className={styles.controlText}>{t('ui.quality')}</span>
      {QUALITIES.map(option => (
        <button key={option} type="button" role="radio" aria-checked={quality === option} className={styles.qualityOption} onClick={() => setQuality(option)}>
          {QUALITY_LABELS[option]}
        </button>
      ))}
    </div>
  )
}

function Controls({ snapshot }: { snapshot: Snapshot }) {
  const soundOn = useAppStore(state => state.soundOn)
  const toggleSound = useAppStore(state => state.toggleSound)
  const focusRepo = useAppStore(state => state.focusRepo)
  const following = useAppStore(state => state.following)
  const focus = useAppStore(state => state.focus)
  const closed = useClosedCounters(snapshot)
  const closedLabel = closed.show ? t('ui.hideClosedCount', { count: closed.hidden }) : t('ui.showClosedCount', { count: closed.hidden })
  return (
    <div className={styles.controls}>
      <FollowingChip />
      {(focusRepo || following) && (
        <button type="button" className={`${styles.control} ${styles.primary}`} onClick={() => focus(null)}>
          <OverviewIcon size={15} />
          {t('ui.overview')}
        </button>
      )}
      {closed.hidden > 0 && (
        <button type="button" className={styles.control} aria-pressed={closed.show} aria-label={closedLabel} title={closedLabel} data-testid="closed-counters-toggle" onClick={closed.toggle}>
          <ShutterIcon size={15} />
          <span className={styles.controlText}>{closed.show ? t('ui.hideClosed') : t('ui.closedCountersLabel')}</span>
          <span className={styles.count}>{closed.hidden}</span>
        </button>
      )}
      <QualityControl />
      <button type="button" className={styles.control} aria-pressed={soundOn} aria-label={soundOn ? t('ui.soundOn') : t('ui.soundOff')} title={soundOn ? t('ui.muteSound') : t('ui.enableSound')} onClick={toggleSound}>
        {soundOn ? <SoundOnIcon size={15} /> : <SoundOffIcon size={15} />}
        <span className={styles.controlText}>{soundOn ? t('ui.soundOn') : t('ui.soundOff')}</span>
      </button>
    </div>
  )
}

export function HudControls({ snapshot, brawls }: { snapshot: Snapshot; brawls: BrawlRef[] }) {
  return (
    <div className={styles.dock} data-keep-panel>
      <Brawls brawls={brawls} />
      <Controls snapshot={snapshot} />
    </div>
  )
}
