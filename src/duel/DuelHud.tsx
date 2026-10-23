'use client'

import { t } from '@/i18n'


import { Avatar } from '@/components/Avatar'
import type { DuelFrame, DuelOutcomeKind, DuelScript } from '@/types/duel'
import { OUTCOME_TITLES } from './timeline'
import styles from './Duel.module.css'

const FLASH_MS = 90
const BIG_HIT = 15
const TITLE_DELAY_MS: Record<DuelOutcomeKind, number> = { approved: 1100, closed: 1300, to_be_continued: 250 }
const OUTCOME_LINE: Record<DuelOutcomeKind, string> = {
  approved: t('ui.prMerged'),
  closed: t('ui.prClosed'),
  to_be_continued: t('ui.prStillOpen'),
}
const CALLOUT_PHASES = new Set(['round', 'go', 'finish'])

function HealthBar({ login, hp, side }: { login: string; hp: number; side: 'left' | 'right' }) {
  const width = `${Math.max(0, hp)}%`
  return (
    <div className={`${styles.health} ${styles[side]}`}>
      <div className={styles.healthName}>
        <Avatar login={login} size={34} className={styles.healthAvatar} />
        <span>{login}</span>
      </div>
      <div className={styles.barFrame}>
        <div className={styles.barTrack}>
          <div className={styles.barTrail} style={{ width }} />
          <div className={`${styles.barFill} ${hp <= 25 ? styles.barDanger : ''}`} style={{ width }} />
        </div>
      </div>
    </div>
  )
}

function Callout({ frame }: { frame: DuelFrame }) {
  if (!CALLOUT_PHASES.has(frame.phase)) return null
  return (
    <p key={frame.phase} className={`${styles.callout} ${styles[`callout_${frame.phase}`]}`} data-testid="duel-callout">
      {frame.caption}
    </p>
  )
}

function sideOf(script: DuelScript, login: string): 'left' | 'right' {
  return login === script.fighters[0] ? 'left' : 'right'
}

function Impact({ script, frame }: { script: DuelScript; frame: DuelFrame }) {
  if (frame.phase !== 'fight' || frame.impactAge === null) return null
  const move = script.moves[frame.moveIndex]
  const big = move.damage >= BIG_HIT || frame.slow
  return (
    <>
      <span key={`dmg-${frame.moveIndex}`} className={`${styles.damage} ${styles[sideOf(script, move.defender)]} ${big ? styles.damageBig : ''}`}>
        {`-${move.damage}`}
      </span>
      {frame.impactAge < FLASH_MS && <div key={`flash-${frame.moveIndex}`} className={styles.flash} />}
    </>
  )
}

function Combo({ script, frame }: { script: DuelScript; frame: DuelFrame }) {
  if (frame.phase !== 'fight' || frame.combo < 2 || frame.impactAge === null) return null
  const attacker = script.moves[frame.moveIndex].attacker
  return (
    <div key={`combo-${frame.moveIndex}`} className={`${styles.combo} ${styles[sideOf(script, attacker)]}`}>
      <b>{frame.combo}</b> {t('ui.hits')}
      <span>{t('ui.combo')}</span>
    </div>
  )
}

function MoveCaption({ script, frame }: { script: DuelScript; frame: DuelFrame }) {
  if (frame.phase !== 'fight') return null
  const move = script.moves[frame.moveIndex]
  return (
    <figure key={`move-${frame.moveIndex}`} className={`${styles.move} ${styles[sideOf(script, move.attacker)]}`}>
      <figcaption>@{move.attacker}</figcaption>
      <blockquote>“{move.excerpt}”</blockquote>
    </figure>
  )
}

function Finale({ script, frame }: { script: DuelScript; frame: DuelFrame }) {
  if (frame.phase !== 'outcome' && frame.phase !== 'done') return null
  const kind = script.outcome.kind
  const shown = frame.phase === 'done' || frame.segmentElapsed >= TITLE_DELAY_MS[kind]
  const winner = script.outcome.winner
  return (
    <>
      {kind === 'to_be_continued' && <div className={styles.sepia} />}
      {shown && kind !== 'to_be_continued' && (
        <div className={`${styles.finale} ${styles[`finale_${kind}`]}`} data-testid="duel-finale">
          <strong>{OUTCOME_TITLES[kind]}</strong>
          <span>{`${OUTCOME_LINE[kind]}${winner ? t('ui.won', { login: winner }) : ''}`}</span>
        </div>
      )}
      {shown && kind === 'to_be_continued' && (
        <div className={styles.tbc} data-testid="duel-finale">
          <div className={styles.tbcArrow}>
            <span>{t('ui.toBeContinued')}</span>
          </div>
          <span className={styles.tbcLine}>{`${OUTCOME_LINE[kind]}${winner ? t('ui.leading', { login: winner }) : ''}`}</span>
        </div>
      )}
    </>
  )
}

export function DuelHud({ script, frame, onRematch }: { script: DuelScript; frame: DuelFrame; onRematch: () => void }) {
  const [left, right] = script.fighters
  return (
    <>
      <div className={styles.bars} data-testid="duel-hud">
        <HealthBar login={left} hp={frame.hp[left]} side="left" />
        <div className={styles.timer}>
          <span>{String(frame.timer).padStart(2, '0')}</span>
          <small>
            {script.pr.repo} #{script.pr.number}
          </small>
        </div>
        <HealthBar login={right} hp={frame.hp[right]} side="right" />
      </div>
      <Callout frame={frame} />
      <Impact script={script} frame={frame} />
      <Combo script={script} frame={frame} />
      <MoveCaption script={script} frame={frame} />
      <Finale script={script} frame={frame} />
      {frame.phase === 'done' && (
        <button type="button" className={styles.rematch} onClick={onRematch}>
          {t('ui.rematch')}
        </button>
      )}
    </>
  )
}
