'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/client/store'
import { playDisco } from '@/sound/sfx'
import { DISCO_MS, isDiscoOn, useEggStore } from './eggStore'
import { createKonamiMatcher } from './konami'

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (TYPING.has(target.tagName) || target.isContentEditable)

// ↑↑↓↓←→←→BA starts the dance; Esc or 15 s ends it.
export function useKonami() {
  useEffect(() => {
    const matches = createKonamiMatcher()
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      const eggs = useEggStore.getState()
      if (event.key === 'Escape' && isDiscoOn(eggs)) return eggs.stopDisco()
      if (matches(event.key)) eggs.startDisco(performance.now())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopMusic = () => {}
    const unsubscribe = useEggStore.subscribe((state, previous) => {
      if (state.discoUntil === previous.discoUntil) return
      clearTimeout(timer)
      stopMusic()
      stopMusic = () => {}
      if (state.discoUntil === null) return
      timer = setTimeout(() => useEggStore.getState().stopDisco(), DISCO_MS)
      if (useAppStore.getState().soundOn) stopMusic = playDisco(DISCO_MS / 1000)
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
      stopMusic()
    }
  }, [])
}
