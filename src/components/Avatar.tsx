'use client'

import { useState } from 'react'
import { avatarTextureUrl } from '@/scene/Badge'
import { hashString } from '@/shared/hash'
import styles from './Avatar.module.css'

const FALLBACK_HUES = [152, 32, 200, 280, 8, 96]
const STACK_LIMIT = 6

const initialOf = (login: string) => login.replace(/[^a-z0-9]/gi, '').charAt(0).toUpperCase() || '?'

export function Avatar({ login, size = 28, className }: { login: string; size?: number; className?: string }) {
  const [broken, setBroken] = useState(false)
  const hue = FALLBACK_HUES[hashString(login) % FALLBACK_HUES.length]
  const style = { width: size, height: size, '--hue': hue, fontSize: Math.round(size * 0.42) } as React.CSSProperties
  return (
    <span className={`${styles.avatar} ${className ?? ''}`} style={style} title={`@${login}`}>
      {broken ? (
        <span className={styles.initial}>{initialOf(login)}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarTextureUrl(login, Math.min(160, size * 3))} alt={`@${login}`} width={size} height={size} loading="lazy" onError={() => setBroken(true)} />
      )}
    </span>
  )
}

export function AvatarStack({ logins, size = 28, empty }: { logins: string[]; size?: number; empty: string }) {
  if (!logins.length) return <span className={styles.empty}>{empty}</span>
  const shown = logins.slice(0, STACK_LIMIT)
  const rest = logins.length - shown.length
  return (
    <span className={styles.stack} aria-label={logins.map(login => `@${login}`).join(', ')}>
      {shown.map(login => (
        <Avatar key={login} login={login} size={size} className={styles.stacked} />
      ))}
      {rest > 0 && (
        <span className={`${styles.avatar} ${styles.stacked} ${styles.more}`} style={{ width: size, height: size }}>
          +{rest}
        </span>
      )}
    </span>
  )
}
