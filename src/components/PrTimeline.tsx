'use client'

import { t } from '@/i18n'


import { shortDateTime } from '@/domain/prPanel'
import type { CiState } from '@/types/domain'
import type { ThreadLoad, TimelineItem } from '@/types/prPanel'
import { Avatar } from './Avatar'
import { CheckCircleIcon, DashCircleIcon, DoorIcon, PendingIcon, XCircleIcon } from './icons'
import styles from './SidePanel.module.css'

const SKELETON_ROWS = 3
const CI_ICON: Record<CiState, typeof CheckCircleIcon> = { success: CheckCircleIcon, failure: XCircleIcon, pending: PendingIcon, none: DashCircleIcon }

export function CiIcon({ state, size = 16 }: { state: CiState; size?: number }) {
  const Icon = CI_ICON[state]
  return <Icon size={size} className={state === 'pending' ? styles.spin : undefined} />
}

function Time({ at }: { at: string }) {
  return (
    <time className={styles.time} dateTime={at}>
      {shortDateTime(at)}
    </time>
  )
}

function Row({ node, children, tone }: { node: React.ReactNode; children: React.ReactNode; tone?: string }) {
  return (
    <li className={styles.event} data-tone={tone}>
      <span className={styles.node}>{node}</span>
      <div className={styles.eventBody}>{children}</div>
    </li>
  )
}

function Item({ item }: { item: TimelineItem }) {
  switch (item.kind) {
    case 'opened':
      return (
        <Row node={<DoorIcon size={14} />} tone="opened">
          <p className={styles.eventLine}>
            <span>
              {t('ui.openedBy')} <strong>@{item.author}</strong>
            </span>
            <Time at={item.at} />
          </p>
        </Row>
      )
    case 'review':
      return (
        <Row node={<Avatar login={item.reviewer} size={26} />}>
          <p className={styles.eventLine}>
            <span className={styles.reviewLine}>
              <strong>@{item.reviewer}</strong>
              <span className={styles.stamp} data-stamp={item.stamp}>
                {item.label}
              </span>
            </span>
            <Time at={item.at} />
          </p>
        </Row>
      )
    case 'comment':
      return (
        <Row node={<Avatar login={item.author} size={26} />}>
          <p className={styles.eventLine}>
            <span>
              <strong>@{item.author}</strong> {t('ui.commented')}
            </span>
            <Time at={item.at} />
          </p>
          <blockquote className={styles.quote}>{item.excerpt}</blockquote>
        </Row>
      )
    case 'ci':
      return (
        <Row node={<CiIcon state={item.state} size={15} />} tone={`ci-${item.state}`}>
          <p className={styles.eventLine}>
            <strong>{item.label}</strong>
            <span className={styles.time}>{t('ui.now')}</span>
          </p>
        </Row>
      )
  }
}

function Skeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <li key={index} className={styles.event} aria-hidden>
          <span className={`${styles.node} ${styles.shimmer}`} />
          <div className={styles.eventBody}>
            <span className={`${styles.bar} ${styles.shimmer}`} style={{ width: `${70 - index * 15}%` }} />
            <span className={`${styles.bar} ${styles.barThin} ${styles.shimmer}`} style={{ width: `${45 + index * 12}%` }} />
          </div>
        </li>
      ))}
    </>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <li className={`${styles.event} ${styles.noteRow}`}>
      <span className={`${styles.node} ${styles.noteNode}`} />
      <p className={styles.note}>{children}</p>
    </li>
  )
}

function Middle({ load, middle, reviewed }: { load: ThreadLoad; middle: TimelineItem[]; reviewed: boolean }) {
  if (load.status === 'loading') return <Skeleton />
  if (load.status === 'failed') return <Note>{t('ui.theConversationCouldNotBeLoadedTheRestOfTheRecordIsUpToDate')}</Note>
  if (!reviewed && !middle.some(item => item.kind === 'review')) {
    return (
      <>
        {middle.map((item, index) => (
          <Item key={index} item={item} />
        ))}
        <Note>{t('ui.nobodyHasStampedThisRecordYet')}</Note>
      </>
    )
  }
  return middle.map((item, index) => <Item key={index} item={item} />)
}

export function PrTimeline({ items, load, reviewed }: { items: TimelineItem[]; load: ThreadLoad; reviewed: boolean }) {
  const [opened, ...rest] = items
  const ci = rest[rest.length - 1]
  const middle = rest.slice(0, -1)
  return (
    <ol className={styles.timeline} aria-busy={load.status === 'loading'}>
      <Item item={opened} />
      <Middle load={load} middle={middle} reviewed={reviewed} />
      <Item item={ci} />
    </ol>
  )
}
