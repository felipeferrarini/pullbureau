'use client'

import { Html } from '@react-three/drei'
import { useEffect, useState } from 'react'
import type { BubbleView } from '@/types/scene'
import { avatarTextureUrl } from './Badge'
import styles from './SpeechBubble.module.css'

export const BUBBLE_Y = 2.75
export const BUBBLE_SEATED_Y = 2.25
const EXIT_MS = 220

type Props = { bubble: BubbleView | null; login: string; height: number }

function useLingering(bubble: BubbleView | null): { shown: BubbleView | null; leaving: boolean } {
  const [last, setLast] = useState(bubble)
  if (bubble && bubble.key !== last?.key) setLast(bubble)
  const leaving = !bubble && last !== null
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => setLast(null), EXIT_MS)
    return () => clearTimeout(timer)
  }, [leaving])
  return { shown: bubble ?? last, leaving }
}

export function SpeechBubble({ bubble, login, height }: Props) {
  const { shown, leaving } = useLingering(bubble)
  if (!shown) return null
  const tilt = ((shown.key.length * 7) % 5) - 2
  return (
    <Html position={[0, height, 0]} zIndexRange={[9, 0]} style={{ pointerEvents: 'none' }}>
      <div className={styles.anchor}>
        <div key={shown.key} className={`${styles.bubble} ${leaving ? styles.leaving : ''}`} style={{ '--tilt': `${tilt * 0.6}deg` } as React.CSSProperties}>
          <header className={styles.header}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.avatar} src={avatarTextureUrl(login, 40)} alt="" width={20} height={20} />
            <strong>@{login}</strong>
          </header>
          {shown.replyTo && <div className={styles.reply}>↪ @{shown.replyTo}</div>}
          <p className={styles.text}>{shown.text}</p>
        </div>
      </div>
    </Html>
  )
}
