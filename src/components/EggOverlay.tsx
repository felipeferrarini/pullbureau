'use client'

import { t } from '@/i18n'


import { isDiscoOn, useEggStore } from '@/eggs/eggStore'
import { useReducedMotion } from '@/scene/render/useReducedMotion'
import styles from './EggOverlay.module.css'

export function EggOverlay() {
  const alarm = useEggStore(state => state.alarm)
  const disco = useEggStore(isDiscoOn)
  const reduced = useReducedMotion()
  return (
    <>
      {alarm && <div className={`${styles.tint} ${styles.alarm} ${reduced ? styles.calm : ''}`} />}
      {alarm && <div className={`${styles.pill} ${styles.alarmPill}`}>{t('ui.fridayDeployDetected')}</div>}
      {disco && !alarm && <div className={`${styles.tint} ${styles.disco}`} />}
      {disco && !alarm && (
        <div className={`${styles.pill} ${styles.discoPill}`}>
          {t('ui.danceMode')}<kbd>Esc</kbd>
        </div>
      )}
    </>
  )
}
