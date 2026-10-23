'use client'

import { t } from '@/i18n'


import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, type Group, type InstancedMesh, type Mesh, type MeshStandardMaterial, Object3D } from 'three'
import type { StampVariant, Vec3 } from '@/types/scene'
import { useDirectorClock } from '../director/DirectorContext'
import { activeEffects } from '../director/plan'
import { useReducedMotion } from '../render/useReducedMotion'
import { FireAlarm } from '../eggs/FireAlarm'
import { Helicopter } from '../eggs/Helicopter'
import { JumpSign } from '../eggs/JumpSign'
import styles from './effects.module.css'

const CONFETTI_COUNT = 80
const GRAVITY = -6
const CONFETTI_COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d', '#f4a261']

const STAMP_LABEL: Record<StampVariant, string> = { approved: t('ui.approved'), rejected: t('ui.rejected'), review: t('ui.underReview') }
const STAMP_INK: Record<StampVariant, string> = { approved: '#1f9d55', rejected: '#d62828', review: '#2b59c3' }
const DROP = 1.4
const HIT_S = 0.18
const HOLD_S = 0.32
const LIFT_S = 0.5

function stamperPose(t: number): { y: number; squash: number; opacity: number } {
  if (t < HIT_S) return { y: DROP * (1 - (t / HIT_S) ** 2), squash: 1, opacity: 1 }
  if (t < HIT_S + HOLD_S) {
    const k = (t - HIT_S) / HOLD_S
    return { y: 0, squash: 1 - 0.28 * Math.sin(Math.PI * Math.min(1, k * 2.5)) * (1 - k), opacity: 1 }
  }
  const k = Math.min(1, (t - HIT_S - HOLD_S) / LIFT_S)
  return { y: DROP * k * k, squash: 1, opacity: 1 - k }
}

function Stamper({ ink }: { ink: string }) {
  const group = useRef<Group>(null)
  const born = useRef<number | null>(null)
  const materials = useRef<MeshStandardMaterial[]>([])
  useFrame(({ clock }) => {
    if (!group.current) return
    born.current ??= clock.elapsedTime
    const pose = stamperPose(clock.elapsedTime - born.current)
    group.current.position.y = pose.y
    group.current.scale.set(1 + (1 - pose.squash) * 0.6, pose.squash, 1 + (1 - pose.squash) * 0.6)
    for (const material of materials.current) material.opacity = pose.opacity
    group.current.visible = pose.opacity > 0.02
  })
  const keep = (material: MeshStandardMaterial | null) => {
    if (material && !materials.current.includes(material)) materials.current.push(material)
  }
  return (
    <group ref={group} position={[0, DROP, 0]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.5, 0.1, 0.32]} />
        <meshStandardMaterial ref={keep} color="#3b2a1e" transparent />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.46, 0.02, 0.28]} />
        <meshStandardMaterial ref={keep} color={ink} transparent />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.26, 12]} />
        <meshStandardMaterial ref={keep} color="#8b5a2b" roughness={0.6} transparent />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial ref={keep} color="#a0522d" roughness={0.5} transparent />
      </mesh>
    </group>
  )
}

function Stamp({ position, variant }: { position: Vec3; variant: StampVariant }) {
  const reduced = useReducedMotion()
  return (
    <group position={position}>
      {!reduced && <Stamper ink={STAMP_INK[variant]} />}
      <Html center position={[0, 0.7, 0]} zIndexRange={[9, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`${styles.stamp} ${styles[variant]} ${reduced ? styles.calm : ''}`} style={{ animationDelay: reduced ? '0ms' : `${HIT_S * 1000}ms` }}>
          {STAMP_LABEL[variant]}
        </div>
      </Html>
    </group>
  )
}

export function Confetti({ position }: { position: Vec3 }) {
  const mesh = useRef<InstancedMesh>(null)
  const born = useRef<number | null>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const seeds = useMemo(
    () => Array.from({ length: CONFETTI_COUNT }, (_, i) => ({ vx: Math.cos(i * 2.4) * (1 + (i % 5) * 0.3), vy: 3 + (i % 7) * 0.5, vz: Math.sin(i * 2.4) * (1 + (i % 3) * 0.4), spin: i })),
    [],
  )

  useLayoutEffect(() => {
    const instances = mesh.current
    if (!instances) return
    seeds.forEach((_, i) => instances.setColorAt(i, new Color(CONFETTI_COLORS[i % CONFETTI_COLORS.length])))
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true
  }, [seeds])

  useFrame(({ clock }) => {
    const instances = mesh.current
    if (!instances) return
    born.current ??= clock.elapsedTime
    const t = clock.elapsedTime - born.current
    seeds.forEach((seed, i) => {
      dummy.position.set(position[0] + seed.vx * t, Math.max(0.05, position[1] + seed.vy * t + (GRAVITY * t * t) / 2), position[2] + seed.vz * t)
      dummy.rotation.set(seed.spin + t * 6, seed.spin * 2 + t * 4, 0)
      dummy.updateMatrix()
      instances.setMatrixAt(i, dummy.matrix)
    })
    instances.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI_COUNT]}>
      <planeGeometry args={[0.12, 0.08]} />
      <meshBasicMaterial side={DoubleSide} />
    </instancedMesh>
  )
}

function Trapdoor({ position }: { position: Vec3 }) {
  const mesh = useRef<Mesh>(null)
  const born = useRef<number | null>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    born.current ??= clock.elapsedTime
    mesh.current.scale.setScalar(Math.min(1, (clock.elapsedTime - born.current) * 4))
  })
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[position[0], 0.02, position[2]]}>
      <circleGeometry args={[0.7, 32]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  )
}

function Banner({ text }: { text: string }) {
  return (
    <Html center position={[0, 6, 0]}>
      <div className={styles.banner}>{text}</div>
    </Html>
  )
}

export function EffectsLayer({ hallCount }: { hallCount: number }) {
  const { plans, now } = useDirectorClock()
  return (
    <>
      {activeEffects(plans, now).map(effect => {
        switch (effect.kind) {
          case 'stamp':
            return <Stamp key={effect.key} position={effect.position} variant={effect.variant} />
          case 'confetti':
            return <Confetti key={effect.key} position={effect.position} />
          case 'trapdoor':
            return <Trapdoor key={effect.key} position={effect.position} />
          case 'banner':
            return <Banner key={effect.key} text={effect.text} />
          case 'jumpSign':
            return <JumpSign key={effect.key} actorId={effect.actorId} />
          case 'alarm':
            return <FireAlarm key={effect.key} count={hallCount} />
          case 'helicopter':
            return <Helicopter key={effect.key} timing={effect.timing} elapsed={effect.elapsed} />
          default:
            return null
        }
      })}
    </>
  )
}
