'use client'

import { type FocusEvent, type PointerEvent, type ReactNode, useId } from 'react'
import type { Tone } from '@/types/hud'
import styles from './Hud.module.css'

export type TipState = { text: string; x: number; y: number; arrow: number } | null
export type TipHandler = (tip: TipState) => void

const TIP_HALF_WIDTH = 140
const TIP_MARGIN = 8
const TIP_GAP = 10

type Props = {
  icon: ReactNode
  label: string
  hint: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
  onTip: TipHandler
  onActivate?: () => void
}

function tipFor(element: HTMLElement, text: string): TipState {
  const rect = element.getBoundingClientRect()
  const center = rect.left + rect.width / 2
  const min = TIP_HALF_WIDTH + TIP_MARGIN
  const x = Math.min(Math.max(center, min), window.innerWidth - min)
  return { text, x, y: rect.bottom + TIP_GAP, arrow: center - x }
}

export function HudMetric({ icon, label, hint, value, sub, tone = 'neutral', onTip, onActivate }: Props) {
  const hintId = useId()
  const show = (event: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>) => onTip(tipFor(event.currentTarget, hint))
  const hide = () => onTip(null)
  const activate = () => {
    hide()
    onActivate?.()
  }
  const body = (
    <>
      <span className={styles.label}>
        {icon}
        {label}
      </span>
      <span className={styles.value} data-tone={tone}>
        {value}
      </span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </>
  )
  const shared = { 'aria-describedby': hintId, onPointerEnter: show, onPointerLeave: hide, onFocus: show, onBlur: hide }
  return (
    <li className={styles.cell}>
      {onActivate ? (
        <button type="button" className={`${styles.metric} ${styles.clickable}`} onClick={activate} {...shared}>
          {body}
        </button>
      ) : (
        <div className={styles.metric} tabIndex={0} {...shared}>
          {body}
        </div>
      )}
      <span id={hintId} className={styles.srOnly}>
        {hint}
      </span>
    </li>
  )
}
