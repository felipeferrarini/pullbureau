import { t, DISPLAY_NAME } from '@/i18n'
import Link from 'next/link'
import styles from '../entrar/page.module.css'
import { GuardScene } from './GuardScene'

export default function ClosedPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.scene}>
          <GuardScene />
        </div>
        <p className={styles.kicker}>{t('ui.organizationTechnologyBureauLabel', { organization: DISPLAY_NAME })}</p>
        <h1>{t('ui.bureauClosedToThePublic')}</h1>
        <p>{t('ui.onlyOrganizationStaffMayEnter', { organization: DISPLAY_NAME })}</p>
        <Link href="/entrar">{t('ui.tryAnotherAccount')}</Link>
      </div>
    </main>
  )
}
