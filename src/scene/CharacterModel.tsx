'use client'

import { Outlines, useAnimations, useGLTF } from '@react-three/drei'
import { type ThreeEvent, createPortal, useFrame } from '@react-three/fiber'
import { Fragment, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { AnimationAction, Bone, Group, Material, Mesh, Object3D } from 'three'
import { LoopOnce, LoopRepeat, Vector3 } from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { CHARACTER_BY_ID, CHARACTER_HEIGHT, type CharacterManifestEntry } from '@/shared/characters'
import type { LogicalAnim } from '@/types/scene'
import { clipLead, isStrike, playsOnce, resolveClip } from './animations'
import { dressMeshes, fuseBody, mergedBody } from './characterBody'
import { idleRhythm, lookFor } from './characterLook'

export const TARGET_HEIGHT = CHARACTER_HEIGHT
const FADE_SECONDS = 0.25
const DUST_MIX = 0.62
const OUTLINE_COLOR = '#ffd166'
const OUTLINE_PX = 0.1
const DEFAULT_LOGIN = 'servidor'

type ClickHandler = (event: ThreeEvent<MouseEvent>) => void
type PointerHandler = (event: ThreeEvent<PointerEvent>) => void
type Props = {
  modelId: string
  anim: LogicalAnim
  login?: string
  seed?: string
  dusty?: boolean
  dust?: number
  highlighted?: boolean
  ghost?: boolean
  onClick?: ClickHandler
  onPointerOver?: PointerHandler
  onPointerOut?: PointerHandler
  chest?: ReactNode
  hand?: ReactNode
  head?: ReactNode
  lookUp?: boolean
  timeScale?: number
}

export function PlaceholderBody({ onClick }: { onClick?: ClickHandler }) {
  return (
    <mesh position={[0, 0.85, 0]} onClick={onClick} castShadow>
      <capsuleGeometry args={[0.3, 1.1, 4, 12]} />
      <meshStandardMaterial color="#9a9a9a" />
    </mesh>
  )
}

const STRIKE_FADE_SECONDS = 0.08

function setLooping(action: AnimationAction, once: boolean) {
  action.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity)
  action.clampWhenFinished = once
}

const findBone = (object: Object3D, pattern: RegExp) => {
  let found: Bone | null = null
  object.traverse(child => {
    if (!found && (child as Bone).isBone && pattern.test(child.name)) found = child as Bone
  })
  return found as Bone | null
}

const worldScale = new Vector3()

function UnitScale({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  useLayoutEffect(() => {
    const group = ref.current
    if (!group) return
    group.scale.setScalar(1)
    group.updateWorldMatrix(true, false)
    group.getWorldScale(worldScale)
    group.scale.setScalar(1 / Math.max(1e-6, worldScale.x))
  }, [])
  return <group ref={ref}>{children}</group>
}

function BoneSlot({ bone, children }: { bone: Bone | null; children: ReactNode }) {
  if (!bone) return null
  return createPortal(<UnitScale>{children}</UnitScale>, bone)
}

type LoadedProps = Omit<Props, 'modelId'> & { entry: CharacterManifestEntry }

const LOOK_UP = 0.55
const GHOST_OPACITY = 0.14

// PROTOTYPE (filtro na cena): swaps in a faint see-through copy of the material while ghosted.
function useGhost(meshes: Mesh[], ghost: boolean) {
  /* eslint-disable react-hooks/immutability */
  useLayoutEffect(() => {
    if (!ghost) return
    const originals = meshes.map(mesh => ({ material: mesh.material, shadow: mesh.castShadow }))
    for (const mesh of meshes) {
      const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material).clone()
      material.transparent = true
      material.opacity = GHOST_OPACITY
      material.depthWrite = false
      mesh.material = material
      mesh.castShadow = false
    }
    return () =>
      meshes.forEach((mesh, i) => {
        ;(mesh.material as Material).dispose()
        mesh.material = originals[i].material
        mesh.castShadow = originals[i].shadow
      })
  }, [meshes, ghost])
  /* eslint-enable react-hooks/immutability */
}

function LoadedCharacter({ entry, anim, login, seed, dusty = false, dust = 0, highlighted = false, ghost = false, onClick, onPointerOver, onPointerOut, chest, hand, head, lookUp = false, timeScale = 1 }: LoadedProps) {
  const { scene, animations } = useGLTF(entry.file)
  const look = useMemo(() => lookFor(login ?? DEFAULT_LOGIN), [login])
  const dustMix = Math.max(dust, dusty ? DUST_MIX : 0)
  const { body, meshes, torso, fist, skull, neck } = useMemo(() => {
    const copy = cloneSkinned(scene)
    const merged = mergedBody(scene)
    const dressed = merged ? fuseBody(copy, merged, look, dustMix) : dressMeshes(copy, look, dustMix)
    return { body: copy, meshes: dressed, torso: findBone(copy, /^torso$/i), fist: findBone(copy, /^fist\.r$/i), skull: findBone(copy, /^head$/i), neck: findBone(copy, /^neck$/i) }
  }, [scene, look, dustMix])
  const group = useRef<Group>(null)
  const { actions, names, mixer } = useAnimations(animations, group)
  const [rhythm] = useState(() => idleRhythm(seed ?? login ?? entry.id))
  const previousAnim = useRef<LogicalAnim | null>(null)

  useEffect(() => {
    const lead = clipLead(anim, previousAnim.current, rhythm.offset)
    previousAnim.current = anim
    const name = resolveClip(names, anim)
    const action = name ? actions[name] : null
    if (!action) return
    setLooping(action, playsOnce(anim))
    const skip = (lead * action.getClip().duration) / rhythm.speed
    action.reset().setEffectiveTimeScale(rhythm.speed).startAt(mixer.time - skip).fadeIn(isStrike(anim) ? STRIKE_FADE_SECONDS : FADE_SECONDS).play()
    return () => {
      action.fadeOut(FADE_SECONDS)
    }
  }, [anim, actions, names, mixer, rhythm])

  useEffect(() => {
    const name = resolveClip(names, anim)
    if (name) actions[name]?.setEffectiveTimeScale(rhythm.speed * timeScale)
  }, [timeScale, anim, actions, names, rhythm])

  useGhost(meshes, ghost)

  useFrame(() => {
    if (lookUp) neck?.rotateX(-LOOK_UP)
  })

  const scale = entry.height > 0 ? TARGET_HEIGHT / entry.height : 1
  return (
    <group ref={group} scale={scale} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <primitive object={body} />
      {highlighted && meshes.map(mesh => <Fragment key={mesh.uuid}>{createPortal(<Outlines thickness={OUTLINE_PX} color={OUTLINE_COLOR} screenspace />, mesh)}</Fragment>)}
      {chest && <BoneSlot bone={torso}>{chest}</BoneSlot>}
      {hand && <BoneSlot bone={fist}>{hand}</BoneSlot>}
      {head && <BoneSlot bone={skull}>{head}</BoneSlot>}
    </group>
  )
}

export function CharacterModel({ modelId, ...rest }: Props) {
  const entry = CHARACTER_BY_ID.get(modelId)
  if (!entry) return <PlaceholderBody onClick={rest.onClick} />
  return <LoadedCharacter entry={entry} {...rest} />
}
