'use client'

import { t, LOCALE } from '@/i18n'


import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/client/store'
import { buildDuelScript, forcedThreadState } from '@/domain/duel'
import { modelLookup } from '@/scene/actors'
import { announce, playSound } from '@/sound/sfx'
import type { PrKey, PrThread } from '@/types/domain'
import type { DuelFrame, DuelOutcomeKind, DuelPhase, DuelScript } from '@/types/duel'
import type { SoundName } from '@/types/scene'
import { DuelArena } from './arena/DuelArena'
import { DuelHud } from './DuelHud'
import { duelFrameAt } from './timeline'
import { useDuelClock } from './useDuelClock'
import { VsScreen } from './VsScreen'
import styles from './Duel.module.css'

const FAILED_CLOSE_MS = 2500
const BIG_HIT = 15
const PHASE_CUES: Partial<Record<DuelPhase, { sounds: SoundName[]; voice?: [string, string] }>> = {
  vs: { sounds: ['gong'] },
  round: { sounds: ['gong'], voice: [t('ui.roundVoice'), LOCALE] },
  go: { sounds: ['crowd'], voice: [t('ui.goVoice'), LOCALE] },
  finish: { sounds: ['tension'], voice: [t('ui.finishVoice'), LOCALE] },
}
const OUTCOME_CUES: Record<DuelOutcomeKind, { sounds: SoundName[]; voice: string }> = {
  approved: { sounds: ['ko', 'fanfare'], voice: t('ui.approvedVoice') },
  closed: { sounds: ['trapdoor', 'ko'], voice: t('ui.closedVoice') },
  to_be_continued: { sounds: ['tbc'], voice: t('ui.continuedVoice') },
}

type Load = { status: 'loading' } | { status: 'failed' } | { status: 'ready'; script: DuelScript }

function useEscapeToClose(close: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])
}

function cue(sounds: SoundName[], voice?: [string, string]) {
  sounds.forEach(playSound)
  if (voice) announce(voice[0], voice[1])
}

function useDuelSounds(script: DuelScript, frame: DuelFrame) {
  const soundOn = useAppStore(state => state.soundOn)
  const phaseKey = frame.phase === 'outcome' || frame.phase === 'done' ? 'outcome' : frame.phase
  const landed = frame.impactAge !== null
  const swingKey = frame.phase === 'fight' ? frame.moveIndex : -1

  useEffect(() => {
    if (!soundOn) return
    if (phaseKey === 'outcome') {
      const outcome = OUTCOME_CUES[script.outcome.kind]
      cue(outcome.sounds, [outcome.voice, LOCALE])
      return
    }
    const phase = PHASE_CUES[phaseKey]
    if (phase) cue(phase.sounds, phase.voice)
  }, [phaseKey, soundOn, script.outcome.kind])

  useEffect(() => {
    if (soundOn && swingKey >= 0) playSound('swing')
  }, [swingKey, soundOn])

  useEffect(() => {
    if (!soundOn || !landed || swingKey < 0) return
    playSound('punch')
    if (script.moves[swingKey].damage >= BIG_HIT) playSound('crowd')
  }, [landed, swingKey, soundOn, script])
}

function DuelPlayer({ script }: { script: DuelScript }) {
  const [run, setRun] = useState(0)
  const clock = useDuelClock(script, run)
  const frame = duelFrameAt(script, clock.elapsed)
  const snapshot = useAppStore(state => state.snapshot)
  const modelFor = useMemo(() => (snapshot ? modelLookup(snapshot) : () => 'none'), [snapshot])
  const crowd = useMemo(() => (snapshot?.board.ranking ?? []).map(entry => entry.login).filter(login => !script.fighters.includes(login)), [snapshot, script])
  const counter = useMemo(() => snapshot?.counters.find(c => c.repo === script.pr.repo) ?? null, [snapshot, script])
  useDuelSounds(script, frame)
  const shaking = frame.phase === 'fight' && frame.impactAge !== null && frame.impactAge < 260
  return (
    <>
      <div className={`${styles.arena} ${shaking ? styles.shaking : ''}`}>
        <DuelArena script={script} frame={frame} hitStop={clock.hitStop} modelFor={modelFor} crowd={crowd} counter={counter} />
      </div>
      {frame.phase === 'vs' ? <VsScreen script={script} /> : <DuelHud script={script} frame={frame} onRematch={() => setRun(value => value + 1)} />}
    </>
  )
}

function forcedState(): ReturnType<typeof forcedThreadState> {
  if (typeof window === 'undefined') return null
  return forcedThreadState(new URLSearchParams(window.location.search).get('finisher'))
}

function scriptFor(thread: PrThread | null): DuelScript | null {
  if (!thread) return null
  const state = forcedState()
  return buildDuelScript(state ? { ...thread, state } : thread)
}

function DuelSession({ prKey }: { prKey: PrKey }) {
  const source = useAppStore(state => state.source)
  const close = useAppStore(state => state.closeDuel)
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const alive = useRef(true)
  useEscapeToClose(close)

  useEffect(() => {
    alive.current = true
    const settle = (next: Load) => alive.current && setLoad(next)
    if (!source) {
      settle({ status: 'failed' })
      return
    }
    source
      .getThread(prKey.repo, prKey.number)
      .then(thread => {
        const script = scriptFor(thread)
        settle(script ? { status: 'ready', script } : { status: 'failed' })
      })
      .catch(() => settle({ status: 'failed' }))
    return () => {
      alive.current = false
    }
  }, [source, prKey.repo, prKey.number])

  useEffect(() => {
    if (load.status !== 'failed') return
    const timer = setTimeout(close, FAILED_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [load.status, close])

  return (
    <div className={styles.overlay} data-testid="duel-overlay">
      {load.status === 'loading' && <p className={styles.status}>{t('ui.preparingTheArena')}</p>}
      {load.status === 'failed' && <p className={styles.status}>{t('ui.duelPostponed')}</p>}
      {load.status === 'ready' && <DuelPlayer script={load.script} />}
      <button type="button" className={styles.back} onClick={close}>
        {t('ui.backToTheBureau')} <kbd>Esc</kbd>
      </button>
    </div>
  )
}

export function DuelOverlay() {
  const key = useAppStore(state => state.duel)
  if (!key) return null
  return <DuelSession key={`${key.repo}#${key.number}`} prKey={key} />
}
