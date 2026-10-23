'use client'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
import { useAppStore } from '@/client/store'
import type { Counter } from '@/types/domain'
import type { SceneSpot } from '@/types/scene'
import { actorObject } from './actorRegistry'
import { customerId } from './actors'
import { type CameraGoal, counterCamera, overviewCamera, sceneBounds } from './layout'
import { boardCamera } from './boardLayout'
import { introCamera } from './walkIn/introTimeline'
import { introElapsed, isIntroPlaying, useIntroStore } from './walkIn/introStore'
import { useReducedMotion } from './render/useReducedMotion'

const EASE = 4
const DONE_DISTANCE = 0.05
const ZOOM_OUT_ROOM = 1.25
const AZIMUTH_LIMIT = 0.55
const MIN_POLAR = 0.45
const MAX_POLAR = 1.32
const FOLLOW_HEIGHT = 5.2
const FOLLOW_BACK = 7
const FOLLOW_LOOK_Y = 1.1

function spotGoal(spot: SceneSpot | null, aspect: number): CameraGoal | null {
  return spot === 'board' ? boardCamera(aspect) : null
}

type Props = { counters: Counter[]; hallCount: number; closedCount: number }

export function CameraRig({ counters, hallCount, closedCount }: Props) {
  const focusRepo = useAppStore(state => state.focusRepo)
  const spot = useAppStore(state => state.spot)
  const camera = useThree(state => state.camera)
  const scene = useThree(state => state.scene)
  const gl = useThree(state => state.gl)
  const controls = useThree(state => state.controls) as OrbitControlsImpl | null
  const aspect = useThree(state => state.size.width / Math.max(1, state.size.height))
  const reduced = useReducedMotion()
  const animating = useRef(false)
  const goalPosition = useMemo(() => new Vector3(), [])
  const goalTarget = useMemo(() => new Vector3(), [])

  const following = useAppStore(state => state.following)
  const playing = useIntroStore(state => state.status === 'playing')
  const focusIndex = counters.findIndex(counter => counter.repo === focusRepo)

  useEffect(() => {
    if (!playing) animating.current = true
  }, [playing])

  useEffect(() => {
    const goal = spotGoal(spot, aspect) ?? (focusIndex >= 0 ? counterCamera(focusIndex, hallCount) : overviewCamera(hallCount, aspect, closedCount))
    goalPosition.set(...goal.position)
    goalTarget.set(...goal.target)
    animating.current = true
  }, [spot, focusIndex, hallCount, closedCount, aspect, goalPosition, goalTarget])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') Object.assign(window, { __pullbureauThree: { camera, controls, scene, gl } })
  }, [camera, controls, scene, gl])

  useEffect(() => {
    if (!controls) return
    const stop = () => {
      animating.current = false
      if (useAppStore.getState().following) useAppStore.getState().follow(null)
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !useAppStore.getState().duel) useAppStore.getState().focus(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function playIntroShot() {
    const elapsed = introElapsed()
    if (elapsed >= useIntroStore.getState().total) {
      useIntroStore.getState().finish()
      return
    }
    const shot = introCamera(elapsed, overviewCamera(hallCount, aspect, closedCount))
    camera.position.set(...shot.position)
    controls?.target.set(...shot.target)
    camera.lookAt(...shot.target)
  }

  function followActor(repo: string, number: number) {
    const actor = actorObject(customerId(repo, number))
    if (!actor) return
    const { x, y, z } = actor.position
    goalTarget.set(x, y + FOLLOW_LOOK_Y, z)
    goalPosition.set(x, y + FOLLOW_HEIGHT, z + FOLLOW_BACK)
    animating.current = true
  }

  useFrame((_, delta) => {
    if (!controls) return
    if (isIntroPlaying()) {
      playIntroShot()
      return
    }
    if (following) followActor(following.repo, following.number)
    if (!animating.current) return
    const k = reduced ? 1 : 1 - Math.exp(-EASE * delta)
    camera.position.lerp(goalPosition, k)
    controls.target.lerp(goalTarget, k)
    controls.update()
    if (camera.position.distanceTo(goalPosition) < DONE_DISTANCE && !following) animating.current = false
  })

  const overview = overviewCamera(hallCount, aspect, closedCount)
  const fitDistance = Math.hypot(...overview.position.map((value, i) => value - overview.target[i]))
  const { minX, maxX } = sceneBounds(hallCount, closedCount)
  const maxDistance = Math.max(maxX - minX, fitDistance) * ZOOM_OUT_ROOM
  return (
    <OrbitControls
      makeDefault
      enabled={!playing}
      target={overview.target}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      minAzimuthAngle={-AZIMUTH_LIMIT}
      maxAzimuthAngle={AZIMUTH_LIMIT}
      minDistance={3.5}
      maxDistance={maxDistance}
      enableDamping
      dampingFactor={0.08}
    />
  )
}
