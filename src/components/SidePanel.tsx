'use client'

import { t } from '@/i18n'


import { useId, useMemo, useRef } from 'react'
import { useAppStore } from '@/client/store'
import { findQueued } from '@/domain/hud'
import { ageBadge, ciLabel, prTimeline, shortDateTime } from '@/domain/prPanel'
import { isBrawl } from '@/domain/queue'
import { ticketCode } from '@/scene/plumbobRules'
import type { QueuedPr, Snapshot } from '@/types/domain'
import { Avatar, AvatarStack } from './Avatar'
import { CameraIcon, CloseIcon, DraftIcon, ExternalIcon, GithubIcon, ThermometerIcon } from './icons'
import { useDismiss, useLingering, useSwipeDown, useThread } from './panelHooks'
import { CiIcon, PrTimeline } from './PrTimeline'
import styles from './SidePanel.module.css'

const EXIT_MS = 220

const keyOf = (pr: QueuedPr) => ({ repo: pr.repo, number: pr.number })

function Chips({ pr }: { pr: QueuedPr }) {
  const age = ageBadge(pr.ageDays)
  return (
    <div className={styles.chips}>
      <span className={styles.chip} data-ci={pr.ci}>
        <CiIcon state={pr.ci} size={14} />
        {ciLabel(pr.ci)}
      </span>
      {pr.isDraft && (
        <span className={styles.chip} data-kind="draft">
          <DraftIcon size={13} />
          {t('ui.draft')}
        </span>
      )}
      <span className={styles.chip} data-age={age.level} title={t('ui.timeSpentInTheQueue')}>
        {age.level === 'fossil' ? <span aria-hidden>🦴</span> : <ThermometerIcon size={14} />}
        {age.label}
      </span>
    </div>
  )
}

function Header({ pr, titleId }: { pr: QueuedPr; titleId: string }) {
  return (
    <section className={styles.head}>
      <div className={styles.identity}>
        <Avatar key={pr.author} login={pr.author} size={52} className={styles.authorAvatar} />
        <div className={styles.identityText}>
          <a className={styles.repoLink} href={pr.url} target="_blank" rel="noreferrer noopener">
            {pr.repo} <span className={styles.prNumber}>#{pr.number}</span>
            <ExternalIcon size={12} />
          </a>
          <p className={styles.byline}>
            {t('ui.by')} <strong>@{pr.author}</strong> · {shortDateTime(pr.createdAt)}
          </p>
        </div>
      </div>
      <h2 id={titleId} className={styles.title}>
        {pr.title}
      </h2>
      <Chips pr={pr} />
    </section>
  )
}

function People({ pr }: { pr: QueuedPr }) {
  const messages = pr.discussion.messages
  return (
    <section className={styles.people}>
      <div className={styles.peopleCol}>
        <h3 className={styles.sectionTitle}>{t('ui.reviewers')}</h3>
        <AvatarStack logins={pr.reviewedBy} size={30} empty={t('ui.nobodyYet')} />
      </div>
      <div className={styles.peopleCol}>
        <h3 className={styles.sectionTitle}>{t('ui.inTheConversation')}</h3>
        <div className={styles.peopleRow}>
          <AvatarStack logins={pr.discussion.participants} size={30} empty={t('ui.allQuiet')} />
          {messages > 0 && <span className={styles.messages}>{messages === 1 ? t('ui.message') : t('ui.messages', { count: messages })}</span>}
        </div>
      </div>
    </section>
  )
}

function Actions({ pr, disabled }: { pr: QueuedPr; disabled: boolean }) {
  const openDuel = useAppStore(state => state.openDuel)
  const follow = useAppStore(state => state.follow)
  const select = useAppStore(state => state.select)
  const followPr = () => {
    follow(keyOf(pr))
    select(null)
  }
  return (
    <footer className={styles.actions}>
      <a className={`${styles.action} ${styles.actionPrimary}`} href={pr.url} target="_blank" rel="noreferrer noopener">
        <GithubIcon size={15} />
        {t('ui.openOnGithub')}
      </a>
      {isBrawl(pr) && (
        <button type="button" className={`${styles.action} ${styles.actionFight}`} disabled={disabled} onClick={() => openDuel(keyOf(pr))}>
          <span aria-hidden>🥊</span>
          {t('ui.watchDuel')}
        </button>
      )}
      <button type="button" className={styles.action} disabled={disabled} onClick={followPr}>
        <CameraIcon size={15} />
        {t('ui.followWithCamera')}
      </button>
    </footer>
  )
}

export function SidePanel({ snapshot }: { snapshot: Snapshot }) {
  const selected = useAppStore(state => state.selected)
  const select = useAppStore(state => state.select)
  const current = useMemo(() => (selected ? findQueued(snapshot, selected) : null), [snapshot, selected])
  const { shown: pr, leaving } = useLingering(current, EXIT_MS)
  const panel = useRef<HTMLElement>(null)
  const titleId = useId()
  const load = useThread(pr ? keyOf(pr) : null)
  const items = useMemo(() => (pr ? prTimeline(pr, load.status === 'ready' ? load.thread : null) : []), [pr, load])
  const swipe = useSwipeDown(panel, () => select(null))
  useDismiss(panel, !!current)

  if (!pr) return null
  return (
    <aside ref={panel} className={styles.panel} data-state={leaving ? 'closing' : 'open'} data-testid="side-panel" role="dialog" aria-modal="false" aria-labelledby={titleId}>
      <div className={styles.grip} {...swipe}>
        <span className={styles.handle} aria-hidden />
        <div className={styles.band}>
          <span className={styles.bandLabel}>{t('ui.serviceRecord')}</span>
          <span className={styles.ticket} aria-label={t('ui.ticketNumber', { number: ticketCode(pr.number) })}>
            <small>{t('ui.ticket')}</small>
            {ticketCode(pr.number)}
          </span>
          <button type="button" className={styles.close} aria-label={t('ui.close')} onClick={() => select(null)}>
            <CloseIcon size={16} />
          </button>
        </div>
      </div>
      <div key={`${pr.repo}#${pr.number}`} className={styles.body}>
        <Header pr={pr} titleId={titleId} />
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('ui.progress')}</h3>
          <PrTimeline items={items} load={load} reviewed={pr.reviewedBy.length > 0} />
        </section>
        <People pr={pr} />
      </div>
      <Actions pr={pr} disabled={leaving} />
    </aside>
  )
}
