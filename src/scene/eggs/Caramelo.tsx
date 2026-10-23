'use client'

import { Billboard, Text } from '@react-three/drei'
import { type ThreeEvent, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type Group, Plane, Vector3 } from 'three'
import { useAppStore } from '@/client/store'
import { DOG_BED, FOLLOW_MS, dogZone, nextActivity, registerClick, restSpot, wanderTarget } from '@/eggs/caramelo'
import { isDiscoOn, useEggStore } from '@/eggs/eggStore'
import { playSound } from '@/sound/sfx'
import type { DogZone } from '@/types/eggs'
import type { FloorPoint, Vec3 } from '@/types/scene'
import { registerActor } from '../actorRegistry'
import { FONT_URL } from '../fonts'
import { DOOR, FACADE_Z } from '../layout'
import { TURN_RATE, lerpAngle } from '../motion'
import { useFootprint } from '../outside/GroundContext'
import { groundHeight } from '../outside/street'
import { isDragRelease } from '../pointer'
import { useIntroOver } from '../walkIn/introStore'
import { DogModel, type DogParts, findDogParts } from './DogModel'
import { DogBed } from './DogBed'
import { Hearts } from './Hearts'

const WALK = 1.05
const TROT = 2.6
const ARRIVE = 0.06
const STREET: Vec3 = [-1.2, 0, FACADE_Z + 5]
const SHOW_SPOT: Vec3 = [0.9, 0, 1.4]
const FOLLOW_MIN_Z = -6
const GAIT = 13
const FACING_CAMERA = 0
const DOG_SCALE = 1.2

type Mode = 'away' | 'walk' | 'stand' | 'sit' | 'lie' | 'follow'
type After = 'stand' | 'sit' | 'lie' | 'nap' | 'love'
type Brain = { mode: Mode; target: Vec3; speed: number; until: number; after: After; sleeping: boolean; sit: number; lie: number; gait: number; happyUntil: number; moving: number; entered: boolean; face: number | null }

const between = (t: number, min: number, max: number) => t + min + Math.random() * (max - min)
const ground = new Plane(new Vector3(0, 1, 0), 0)
const hit = new Vector3()

function goTo(brain: Brain, target: Vec3, speed: number, after: After) {
  Object.assign(brain, { mode: 'walk', target, speed, after, sleeping: false, face: null })
}

function decide(brain: Brain, t: number, zone: DogZone, oldest: Vec3 | null, bed: Vec3) {
  const activity = nextActivity(Math.random, oldest !== null)
  if (activity === 'visit' && oldest) return goTo(brain, restSpot(oldest), WALK, 'lie')
  if (activity === 'nap') return goTo(brain, bed, WALK, 'nap')
  if (activity === 'sit') return Object.assign(brain, { mode: 'sit', until: between(t, 3, 6) })
  goTo(brain, wanderTarget(zone, brain.target), WALK, Math.random() < 0.5 ? 'stand' : 'sit')
}

function arrive(brain: Brain, t: number, love: () => void) {
  const { after } = brain
  if (after === 'love') {
    love()
    return Object.assign(brain, { mode: 'sit', until: t + 6, happyUntil: t + 6, face: FACING_CAMERA })
  }
  if (after === 'lie' || after === 'nap') return Object.assign(brain, { mode: 'lie', until: between(t, after === 'nap' ? 12 : 8, after === 'nap' ? 20 : 14), sleeping: after === 'nap' })
  Object.assign(brain, { mode: after, until: between(t, 1.5, after === 'sit' ? 5 : 3) })
}

function pointerTarget(state: { raycaster: { setFromCamera: (p: unknown, c: unknown) => void; ray: { intersectPlane: (p: Plane, o: Vector3) => Vector3 | null } }; pointer: unknown; camera: unknown }, zone: DogZone): Vec3 | null {
  state.raycaster.setFromCamera(state.pointer, state.camera)
  if (!state.raycaster.ray.intersectPlane(ground, hit)) return null
  return [Math.min(zone.maxX, Math.max(zone.minX, hit.x)), 0, Math.min(zone.maxZ, Math.max(FOLLOW_MIN_Z, hit.z))]
}

function pose(parts: DogParts, brain: Brain, t: number, reduced: boolean, dancing: boolean) {
  const swing = Math.sin(brain.gait) * 0.6 * brain.moving
  const hop = dancing && !reduced ? Math.abs(Math.sin(t * 7)) * 0.12 * (1 - brain.moving) : 0
  const bob = Math.abs(Math.sin(brain.gait)) * 0.02 * brain.moving + hop
  parts.body?.position.setY(-0.1 * brain.sit - 0.21 * brain.lie + bob)
  parts.body?.rotation.set(-0.45 * brain.sit, 0, 0)
  const legAngles = [swing + 0.45 * brain.sit - 1.45 * brain.lie, -swing + 0.45 * brain.sit - 1.45 * brain.lie, -swing - 0.8 * brain.sit + 1.35 * brain.lie, swing - 0.8 * brain.sit + 1.35 * brain.lie]
  parts.legs.forEach((leg, i) => leg?.rotation.set(legAngles[i], 0, 0))
  const happy = t < brain.happyUntil || dancing
  const look = brain.moving > 0.5 || brain.sleeping || reduced ? 0 : Math.sin(t * 0.7) * 0.45
  parts.head?.rotation.set(-0.15 * brain.sit + (brain.sleeping ? 0.45 : 0.2) * brain.lie, look, 0)
  parts.eyes?.scale.set(1, brain.sleeping ? 0.15 : 1, 1)
  if (parts.tongue) parts.tongue.visible = happy || brain.mode === 'follow'
  const wag = reduced ? 0 : Math.sin(t * (happy || brain.mode === 'follow' ? 20 : 7)) * (brain.sleeping ? 0.08 : 0.55)
  parts.tail?.rotation.set(0, 0, wag)
}

function useDogPointer(onBark: () => void) {
  const soundOn = useAppStore(state => state.soundOn)
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (isDragRelease(event)) return
    if (soundOn) playSound('bark')
    onBark()
  }
}

export function Caramelo({ hallCount, lines, oldest, reduced }: { hallCount: number; lines: FloorPoint[][]; oldest: Vec3 | null; reduced: boolean }) {
  const root = useRef<Group>(null)
  const parts = useRef<DogParts | null>(null)
  const footprint = useFootprint()
  const zone = useMemo(() => dogZone(hallCount, lines), [hallCount, lines])
  const introOver = useIntroOver()
  const showOff = useEggStore(state => state.dogShowOff)
  const dancing = useEggStore(isDiscoOn)
  const brain = useRef<Brain>({ mode: 'away', target: STREET, speed: WALK, until: 0, after: 'stand', sleeping: false, sit: 0, lie: 0, gait: 0, happyUntil: 0, moving: 0, entered: false, face: null })
  const clicks = useRef<number[]>([])
  const clock = useRef(0)
  const [barkAt, setBarkAt] = useState<number | null>(null)
  const [loveAt, setLoveAt] = useState<number | null>(null)

  useEffect(() => (root.current ? registerActor('dog:caramelo', root.current) : undefined), [])

  useEffect(() => {
    if (!introOver || showOff === 0) return
    goTo(brain.current, SHOW_SPOT, TROT, 'love')
  }, [introOver, showOff])

  const love = () => {
    setLoveAt(clock.current)
    brain.current.happyUntil = clock.current + 4
  }

  const onClick = useDogPointer(() => {
    const t = clock.current
    setBarkAt(t)
    const next = registerClick(clicks.current, performance.now())
    clicks.current = next.clicks
    if (next.love) love()
    Object.assign(brain.current, { mode: 'follow', until: t + FOLLOW_MS / 1000, sleeping: false, speed: TROT, happyUntil: t + FOLLOW_MS / 1000 })
  })

  useFrame((state, delta) => {
    const group = root.current
    const dog = brain.current
    const t = state.clock.elapsedTime
    clock.current = t
    if (!group) return
    if (!dog.entered) {
      if (!introOver) return
      group.position.set(...STREET)
      group.visible = true
      dog.entered = true
      if (dog.mode === 'away') goTo(dog, DOOR.inside, WALK, 'stand')
    }
    if (dog.mode === 'follow') {
      const target = pointerTarget(state as never, zone)
      if (target) dog.target = target
      if (t > dog.until) Object.assign(dog, { mode: 'stand', until: t + 1.2, target: [group.position.x, 0, group.position.z] })
    }
    const dx = dog.target[0] - group.position.x
    const dz = dog.target[2] - group.position.z
    const distance = Math.hypot(dx, dz)
    const walking = (dog.mode === 'walk' || dog.mode === 'follow') && distance > ARRIVE
    if (walking) {
      const step = Math.min(distance, dog.speed * delta)
      const x = group.position.x + (dx / distance) * step
      const z = group.position.z + (dz / distance) * step
      group.position.set(x, groundHeight(x, z, footprint), z)
      group.rotation.y = lerpAngle(group.rotation.y, Math.atan2(dx, dz), TURN_RATE * delta)
      dog.gait += step * GAIT
    } else if (dog.face !== null) group.rotation.y = lerpAngle(group.rotation.y, dog.face, TURN_RATE * 0.5 * delta)
    if (!walking && dog.mode === 'walk') arrive(dog, t, love)
    else if (!walking && dog.mode !== 'follow' && t > dog.until) decide(dog, t, zone, oldest, DOG_BED)
    const blend = Math.min(1, delta * 6)
    dog.moving += ((walking ? 1 : 0) - dog.moving) * blend
    dog.sit += ((dog.mode === 'sit' ? 1 : 0) - dog.sit) * blend
    dog.lie += ((dog.mode === 'lie' ? 1 : 0) - dog.lie) * blend
    parts.current ??= findDogParts(group)
    pose(parts.current, dog, t, reduced, dancing)
  })

  const hover = (value: boolean) => {
    document.body.style.cursor = value ? 'pointer' : ''
  }

  return (
    <>
      <DogBed position={DOG_BED} />
      <group ref={root} visible={false}>
        <group scale={DOG_SCALE}>
          <DogModel onClick={onClick} onHover={hover} />
        </group>
        {barkAt !== null && <Bark key={barkAt} bornAt={barkAt} />}
        {loveAt !== null && <Hearts key={loveAt} bornAt={loveAt} />}
      </group>
    </>
  )
}

function Bark({ bornAt }: { bornAt: number }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    const group = ref.current
    if (!group) return
    const age = clock.elapsedTime - bornAt
    group.visible = age < 1.1
    group.scale.setScalar(Math.min(1, age * 8))
  })
  return (
    <group ref={ref} position={[0, 1.1, 0]} visible={false}>
      <Billboard>
        <Text font={FONT_URL} fontSize={0.2} color="#3a2414" outlineWidth={0.022} outlineColor="#fff8ec" anchorX="center">
          AU! AU!
        </Text>
      </Billboard>
    </group>
  )
}
