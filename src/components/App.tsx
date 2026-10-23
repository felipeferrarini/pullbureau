'use client'

import { t } from '@/i18n'

import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import { useEffect } from 'react'
import { useAppStore } from '@/client/store'
import { useDataFeed } from '@/client/useDataFeed'
import { useInspection } from '@/eggs/useInspection'
import { useEggTriggers } from '@/eggs/useEggTriggers'
import { useKonami } from '@/eggs/useKonami'
import { useStrikeWatcher } from '@/eggs/useStrikeWatcher'
import { DuelOverlay } from '@/duel/DuelOverlay'
import { Experience } from '@/scene/Experience'
import { FilterHud } from '@/scene/filterPrototype/FilterHud'
import { useIntroStore } from '@/scene/walkIn/introStore'
import styles from './App.module.css'
import { EggOverlay } from './EggOverlay'
import { Hud } from './Hud'
import { IntroOverlay } from './IntroOverlay'
import { SidePanel } from './SidePanel'
import { Ticker } from './Ticker'

export function App({ viewerLogin }: { viewerLogin: string | null }) {
  const snapshot = useAppStore(state => state.snapshot)
  const error = useAppStore(state => state.error)
  const cinematic = useIntroStore(state => state.status === 'playing')

  useEffect(() => {
    useAppStore.getState().setViewer(viewerLogin)
  }, [viewerLogin])
  useDataFeed()
  useInspection()
  useStrikeWatcher()
  useEggTriggers()
  useKonami()

  if (!snapshot) return <div className={styles.loading}>{error ?? t('ui.openingTheBureau')}</div>
  return (
    <main className={styles.main}>
      <Experience snapshot={snapshot} />
      <div className={styles.chrome} data-hidden={cinematic}>
        <Hud snapshot={snapshot} />
        <Ticker events={snapshot.events} />
        <FilterHud snapshot={snapshot} />
      </div>
      <EggOverlay />
      <SidePanel snapshot={snapshot} />
      <DuelOverlay />
      <IntroOverlay />
    </main>
  )
}
