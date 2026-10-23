import { t, DISPLAY_NAME } from '@/i18n'
import { signIn } from '@/auth'
import styles from './page.module.css'

export default function SignInPage() {
  async function enter() {
    'use server'
    await signIn('github', { redirectTo: '/' })
  }
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.kicker}>{t('ui.organizationTechnologyBureauLabel', { organization: DISPLAY_NAME })}</p>
        <h1>{t('ui.takeATicketLabel')}</h1>
        <p>{t('ui.entryRestrictedToOrganizationStaff', { organization: DISPLAY_NAME })}</p>
        <form action={enter}>
          <button type="submit" className={styles.button}>
            {t('ui.signInWithGithub')}
          </button>
        </form>
      </div>
    </main>
  )
}
