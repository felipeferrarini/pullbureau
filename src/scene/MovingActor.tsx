'use client'

import { useFrame } from '@react-three/fiber'
import { type ReactNode, type RefObject, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import type { Rect } from '@/types/outside'
import type { ActiveOverride, Actor, LogicalAnim, Vec3 } from '@/types/scene'
import { registerActor } from './actorRegistry'
import { type StoolPhase, chairLift, nextStoolPhase, seatOf, sitsDown } from './seat'
import { clearStoolPhase, setStoolPhase } from './stoolRegistry'
import { Badge } from './Badge'
import { CharacterModel, PlaceholderBody } from './CharacterModel'
import { RUN_SPEED, TURN_RATE, WALK_SPEED, lerpAngle, stepTowards } from './motion'
import { walkRoute } from './walkRoute'
import { isDragRelease } from './pointer'
import { useFootprint } from './outside/GroundContext'
import { groundHeight } from './outside/street'
import { SafeBoundary } from './SafeBoundary'
import { introPosition } from './walkIn/introTimeline'
import { introElapsed, useIntroStore } from './walkIn/introStore'

const BADGE_OFFSET: [number, number, number] = [0, 0.12, 0.2]

const grounded = ([x, , z]: Vec3, footprint: Rect): Vec3 => [x, groundHeight(x, z, footprint), z]
const LIFT_RATE = 3

type Path = { key: string; points: Vec3[] }

// Walks the route waypoint by waypoint; only the last one ends the walk.
function followPath(current: Vec3, path: Path, maxStep: number, footprint: Rect) {
  let step = stepTowards(current, grounded(path.points[0], footprint), maxStep)
  while (!step.moving && path.points.length > 1) {
    path.points = path.points.slice(1)
    step = { ...stepTowards(current, grounded(path.points[0], footprint), maxStep), moving: true }
  }
  return step
}

// Queue customers sit on a stool they pull in first; the waiting room sits up on the chair cushion.
function useSeating(actor: Actor, baseAnim: LogicalAnim, liftRef: RefObject<Group | null>) {
  const seat = seatOf(actor.modelId)
  const stooled = actor.kind === 'customer' && baseAnim === 'sit'
  const lift = actor.kind === 'waiting' && baseAnim === 'sit' ? chairLift(seat) : 0
  const phase = useRef<StoolPhase | null>(null)
  const [down, setDown] = useState(stooled)
  const downRef = useRef(stooled)
  const [initialLift] = useState(lift)

  useEffect(() => () => void clearStoolPhase(actor.id), [actor.id])

  const settle = (moving: boolean, now: number, delta: number) => {
    if (actor.kind === 'customer') {
      phase.current = nextStoolPhase(phase.current, stooled && !moving, now)
      setStoolPhase(actor.id, phase.current)
      const sits = sitsDown(phase.current, now)
      if (sits !== downRef.current) {
        downRef.current = sits
        setDown(sits)
      }
    }
    const group = liftRef.current
    if (group) group.position.y += ((moving ? 0 : lift) - group.position.y) * Math.min(1, LIFT_RATE * delta)
  }
  return { pulling: stooled && !down, initialLift, settle }
}

type Props = {
  actor: Actor
  override: ActiveOverride | null
  highlighted?: boolean
  ghost?: boolean
  showBadge?: boolean
  onSelect?: () => void
  onHover?: (hovered: boolean) => void
  hand?: ReactNode
  head?: ReactNode
  lookUp?: boolean
  dust?: number
  children?: ReactNode
}

export function MovingActor({ actor, override, highlighted = false, ghost = false, showBadge = false, onSelect, onHover, hand, head, lookUp = false, dust = 0, children }: Props) {
  const ref = useRef<Group>(null)
  const footprint = useFootprint()
  const [initialPosition] = useState(() => grounded(actor.position, footprint))
  const [initialFacing] = useState(actor.facing)
  const [moving, setMoving] = useState(false)
  const movingRef = useRef(false)

  const goal = override?.target ?? actor.position
  const target = grounded(goal, footprint)
  const path = useRef<Path | null>(null)
  const facing = override?.facing ?? actor.facing
  const speed = override?.run ? RUN_SPEED : WALK_SPEED

  useLayoutEffect(() => {
    if (override?.from && ref.current) ref.current.position.set(...grounded(override.from, footprint))
  }, [override?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => (ref.current ? registerActor(actor.id, ref.current) : undefined), [actor.id])

  const route = useIntroStore(state => (state.status === 'playing' ? state.routes.get(actor.id) : undefined))
  const introDone = useIntroStore(state => state.status === 'done')
  useLayoutEffect(() => {
    if (introDone && ref.current) ref.current.position.set(...target)
  }, [introDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const baseAnim = override?.anim ?? actor.anim
  const liftRef = useRef<Group>(null)
  const { pulling, initialLift, settle } = useSeating(actor, baseAnim, liftRef)

  useFrame(({ clock }, delta) => {
    const group = ref.current
    if (!group) return
    const step = route ? introPosition(route, introElapsed()) : null
    const here: Vec3 = [group.position.x, group.position.y, group.position.z]
    const key = `${override?.key ?? ''}|${goal.join()}`
    if (!step && path.current?.key !== key) path.current = { key, points: walkRoute(here, goal, footprint) }
    const { next, moving: isMoving, heading } = step
      ? { next: step.position, moving: step.moving, heading: step.heading }
      : followPath(here, path.current as Path, speed * delta, footprint)
    group.position.set(next[0], groundHeight(next[0], next[2], footprint), next[2])
    group.rotation.y = lerpAngle(group.rotation.y, heading ?? facing, TURN_RATE * delta)
    if (isMoving !== movingRef.current) {
      movingRef.current = isMoving
      setMoving(isMoving)
    }
    settle(isMoving, clock.elapsedTime, delta)
  })

  const anim: LogicalAnim = moving ? (override?.moveAnim ?? (override?.run ? 'run' : 'walk')) : pulling ? 'idle' : baseAnim
  const handleClick = onSelect
    ? (event: { stopPropagation: () => void; delta: number }) => {
        event.stopPropagation()
        if (isDragRelease(event)) return
        onSelect()
      }
    : undefined
  const hover = (value: boolean) => (event: { stopPropagation: () => void }) => {
    if (!onSelect) return
    event.stopPropagation()
    onHover?.(value)
    document.body.style.cursor = value ? 'pointer' : ''
  }

  return (
    <group ref={ref} position={initialPosition} rotation-y={initialFacing}>
      <group ref={liftRef} position-y={initialLift}>
      <SafeBoundary fallback={<PlaceholderBody onClick={handleClick} />}>
        <Suspense fallback={<PlaceholderBody onClick={handleClick} />}>
          <CharacterModel
            modelId={actor.modelId}
            anim={anim}
            login={actor.login}
            seed={actor.id}
            dusty={actor.dusty}
            dust={dust}
            highlighted={highlighted}
            ghost={ghost}
            onClick={handleClick}
            onPointerOver={hover(true)}
            onPointerOut={hover(false)}
            chest={showBadge || highlighted ? <group position={BADGE_OFFSET}><Badge login={actor.login} /></group> : null}
            hand={hand}
            head={head}
            lookUp={lookUp}
          />
        </Suspense>
      </SafeBoundary>
      </group>
      {children}
    </group>
  )
}
