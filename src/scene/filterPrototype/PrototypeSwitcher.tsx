'use client'

import { t } from '@/i18n'


// Prototype: explore how filtering appears in the 3D scene.
import { useEffect } from 'react'
import { VARIANTS, VARIANT_NAMES, useFilterStore } from './filterStore'
import styles from './FilterHud.module.css'

const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.matches('input, textarea') || target.isContentEditable)

export function PrototypeSwitcher() {
  const variant = useFilterStore(state => state.variant)
  const setVariant = useFilterStore(state => state.setVariant)
  const cycle = (delta: number) => setVariant(VARIANTS[(VARIANTS.indexOf(variant) + delta + VARIANTS.length) % VARIANTS.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (typing(event.target) || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
      cycle(event.key === 'ArrowLeft' ? -1 : 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (process.env.NODE_ENV === 'production') return null
  return (
    <div className={styles.switcher} data-keep-panel>
      <button type="button" aria-label={t('ui.previousVariation')} onClick={() => cycle(-1)}>
        ←
      </button>
      <span>
        <strong>{variant}</strong> {VARIANT_NAMES[variant]}
      </span>
      <button type="button" aria-label={t('ui.nextVariation')} onClick={() => cycle(1)}>
        →
      </button>
    </div>
  )
}
