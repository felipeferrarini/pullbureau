'use client'

import { type PointerEvent as ReactPointerEvent, type RefObject, useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/client/store'
import type { PrKey } from '@/types/domain'
import type { ThreadLoad } from '@/types/prPanel'

const CLICK_SLOP_PX = 6
const DRAG_START_PX = 6
const SWIPE_CLOSE_PX = 90
const SWIPE_CLOSE_SPEED = 0.6
const SHEET_QUERY = '(max-width: 640px)'

const selectedId = () => {
  const selected = useAppStore.getState().selected
  return selected ? `${selected.repo}#${selected.number}` : null
}

const keepsPanel = (panel: HTMLElement | null, target: EventTarget | null) =>
  target instanceof Element && (!!panel?.contains(target) || !!target.closest('[data-keep-panel]'))

export function useLingering<T>(value: T | null, exitMs: number): { shown: T | null; leaving: boolean } {
  const [last, setLast] = useState(value)
  if (value && value !== last) setLast(value)
  const leaving = !value && last !== null
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => setLast(null), exitMs)
    return () => clearTimeout(timer)
  }, [leaving, exitMs])
  return { shown: value ?? last, leaving }
}

export function useDismiss(panel: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return
    let down: { id: string | null; x: number; y: number; kept: boolean } | null = null
    const close = () => useAppStore.getState().select(null)
    const onPointerDown = (event: PointerEvent) => {
      down = { id: selectedId(), x: event.clientX, y: event.clientY, kept: keepsPanel(panel.current, event.target) }
    }
    const onClick = (event: MouseEvent) => {
      const start = down
      down = null
      if (!start || start.kept || keepsPanel(panel.current, event.target)) return
      const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y)
      if (moved < CLICK_SLOP_PX && selectedId() === start.id) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || useAppStore.getState().duel) return
      event.stopPropagation()
      close()
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('click', onClick)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [panel, open])
}

export function useThread(key: PrKey | null): ThreadLoad {
  const source = useAppStore(state => state.source)
  const [loaded, setLoaded] = useState<{ id: string; load: ThreadLoad } | null>(null)
  const repo = key?.repo ?? null
  const number = key?.number ?? null
  const id = repo && number !== null ? `${repo}#${number}` : null

  useEffect(() => {
    if (!source || repo === null || number === null) return
    let alive = true
    const done = (load: ThreadLoad) => alive && setLoaded({ id: `${repo}#${number}`, load })
    source.getThread(repo, number).then(
      thread => done({ status: 'ready', thread }),
      () => done({ status: 'failed' }),
    )
    return () => {
      alive = false
    }
  }, [source, repo, number])

  if (!source) return { status: 'ready', thread: null }
  return loaded && loaded.id === id ? loaded.load : { status: 'loading' }
}

export function useSwipeDown(sheet: RefObject<HTMLElement | null>, onClose: () => void) {
  const drag = useRef<{ y: number; at: number; active: boolean } | null>(null)
  const setDrag = (px: number, animate: boolean) => {
    const element = sheet.current
    if (!element) return
    element.style.setProperty('--drag', `${px}px`)
    if (animate) element.style.removeProperty('transition')
    else element.style.setProperty('transition', 'none')
  }
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!window.matchMedia(SHEET_QUERY).matches || event.button !== 0) return
    drag.current = { y: event.clientY, at: performance.now(), active: false }
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const start = drag.current
    if (!start) return
    const dy = Math.max(0, event.clientY - start.y)
    if (!start.active && dy > DRAG_START_PX) {
      start.active = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (start.active) setDrag(dy, false)
  }
  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = drag.current
    drag.current = null
    if (!start?.active) return
    const dy = Math.max(0, event.clientY - start.y)
    const speed = dy / Math.max(1, performance.now() - start.at)
    if (dy > SWIPE_CLOSE_PX || speed > SWIPE_CLOSE_SPEED) return onClose()
    setDrag(0, true)
  }
  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }
}
