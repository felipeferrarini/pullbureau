'use client'

import { t } from '@/i18n'


import { Avatar } from '@/components/Avatar'
import type { DuelScript } from '@/types/duel'
import styles from './Duel.module.css'

function Contender({ login, author, side }: { login: string; author: string; side: 'left' | 'right' }) {
  return (
    <div className={`${styles.contender} ${styles[side]}`}>
      <div className={styles.contenderPhoto}>
        <Avatar login={login} size={112} />
      </div>
      <div className={styles.contenderText}>
        <span className={styles.contenderName} style={{ '--len': Math.max(8, login.length) } as React.CSSProperties}>
          {login}
        </span>
        <span className={styles.contenderRole}>{login === author ? t('ui.openedThePr') : t('ui.reviewing')}</span>
      </div>
    </div>
  )
}

export function VsScreen({ script }: { script: DuelScript }) {
  const [left, right] = script.fighters
  return (
    <div className={styles.vs}>
      <div className={styles.vsTint} />
      <header className={styles.vsBanner}>
        <span className={styles.vsRepo}>
          {script.pr.repo} <b>#{script.pr.number}</b>
        </span>
        <h2 className={styles.vsTitle}>{script.pr.title}</h2>
      </header>
      <strong className={styles.vsMark}>VS</strong>
      <Contender login={left} author={script.pr.author} side="left" />
      <Contender login={right} author={script.pr.author} side="right" />
    </div>
  )
}
