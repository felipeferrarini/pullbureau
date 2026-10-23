import { t, DISPLAY_NAME, LOCALE } from '@/i18n'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: t('ui.organizationTechnologyBureauLabel', { organization: DISPLAY_NAME }),
  description: t('ui.theOrganizationPrQueueAsABureau', { organization: DISPLAY_NAME }),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={LOCALE}>
      {/* browser extensions (e.g. ColorZilla) add attributes to body before hydration */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
