'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { t } from '@/i18n'
import type { DataSource } from '@/types/client'
import type { ReplayFixture } from '@/types/replay'
import { PLAYED_KEY, createLocalCursorStore, createMemoryCursorStore, parsePlayed } from './cursorStore'
import { selectNewEvents } from './eventScheduler'
import { SourceError, createLiveSource } from './liveSource'
import { DEFAULT_REPLAY_SPEED, createReplaySource, selectReplay } from './replaySource'
import { useAppStore } from './store'

const OUTAGE_MESSAGE = t('ui.theBureauSystemIsDownTryingAgain')

async function loadFixture(name: string): Promise<ReplayFixture> {
  const response = await fetch(`/api/replay/${encodeURIComponent(name)}`)
  if (!response.ok) throw new Error(`replay ${name} not found`)
  return (await response.json()) as ReplayFixture
}

function handleError(error: unknown, navigate: (path: string) => void) {
  if (error instanceof SourceError && error.status === 401) {
    navigate('/entrar')
    return
  }
  useAppStore.getState().setError(OUTAGE_MESSAGE)
}

export function useDataFeed() {
  const router = useRouter()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const replay = selectReplay(params, process.env.DEMO_MODE)
    const speed = Number(params.get('speed')) || DEFAULT_REPLAY_SPEED
    const cursors = replay ? createMemoryCursorStore() : createLocalCursorStore()
    const playedStore = replay ? createMemoryCursorStore() : createLocalCursorStore(undefined, PLAYED_KEY)
    let stop = () => {}
    let cancelled = false

    const run = (source: DataSource) => {
      useAppStore.getState().setSource(source)
      stop = source.start(snapshot => {
        const { toPlay, skipped, cursor, played } = selectNewEvents(snapshot.events, cursors.read(), source.now(), parsePlayed(playedStore.read()))
        cursors.write(cursor)
        playedStore.write(JSON.stringify(played))
        useAppStore.getState().receive(snapshot, toPlay, skipped)
      }, error => handleError(error, path => router.push(path)))
    }

    if (replay) {
      useAppStore.getState().setReplay(replay)
      loadFixture(replay)
        .then(fixture => !cancelled && run(createReplaySource(fixture, speed)))
        .catch(() => useAppStore.getState().setError(t('ui.replayNotFound', { replay })))
    } else {
      run(createLiveSource())
    }

    return () => {
      cancelled = true
      stop()
    }
  }, [router])
}
