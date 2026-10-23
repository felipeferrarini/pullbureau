'use client'

import { t as translate } from '@/i18n'


import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, PointLight } from 'three'
import { Confetti } from '@/scene/effects/EffectsLayer'
import { FONT_URL } from '@/scene/fonts'
import type { DuelFrame, DuelScript } from '@/types/duel'
import { BOOTH_Z } from './ArenaSet'
import { FIGHT_X, STAMP_HIT_MS, TRAPDOOR_DROP_MS, sideSign } from './fighterPose'

const STAMP_DROP = 7
const STAMP_FALL_MS = 340
const STAMP_LIFT_MS = 2300
const SHUTTER_MS = 1500
const SHUTTER_TOP = 3.1
const SHUTTER_BOTTOM = 1.15
const INK = '#1f9d55'

type Props = { script: DuelScript; frame: DuelFrame; reduced: boolean }

const outcomeTime = (frame: DuelFrame) => (frame.phase === 'done' ? Number.POSITIVE_INFINITY : frame.segmentElapsed)

function stampY(t: number): number {
  const start = STAMP_HIT_MS - STAMP_FALL_MS
  if (t < start) return STAMP_DROP
  if (t < STAMP_HIT_MS) return STAMP_DROP * (1 - ((t - start) / STAMP_FALL_MS) ** 2)
  if (t < STAMP_LIFT_MS) return 0
  return Math.min(STAMP_DROP, ((t - STAMP_LIFT_MS) / 600) ** 2 * STAMP_DROP)
}

function GiantStamp({ x, t }: { x: number; t: number }) {
  const y = stampY(t)
  const squash = t >= STAMP_HIT_MS && t < STAMP_HIT_MS + 220 ? 1 - 0.25 * Math.sin(((t - STAMP_HIT_MS) / 220) * Math.PI) : 1
  return (
    <group position={[x, y, 0]} scale={[1 + (1 - squash), squash, 1 + (1 - squash)]}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.9, 0.1, 1.25]} />
        <meshStandardMaterial color={INK} roughness={0.35} emissive={INK} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[2.0, 0.44, 1.35]} />
        <meshStandardMaterial color="#5b3a22" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <boxGeometry args={[2.04, 0.06, 1.39]} />
        <meshStandardMaterial color="#d9a62e" metalness={1} roughness={0.25} />
      </mesh>
      <Text font={FONT_URL} position={[0, 0.32, 0.68]} fontSize={0.26} color="#ffe9a8" anchorX="center" anchorY="middle">
        {translate('ui.approved')}
      </Text>
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.34, 1.2, 20]} />
        <meshStandardMaterial color="#8e2b1b" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.78, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 24]} />
        <meshStandardMaterial color="#d9a62e" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 2.15, 0]} castShadow>
        <sphereGeometry args={[0.46, 28, 18]} />
        <meshStandardMaterial color="#a8321f" roughness={0.25} />
      </mesh>
    </group>
  )
}

function InkMark({ x }: { x: number }) {
  return (
    <group position={[x, 0.02, 0.05]} rotation={[-Math.PI / 2, 0, 0.12]}>
      <mesh>
        <planeGeometry args={[2.1, 1.3]} />
        <meshStandardMaterial color={INK} transparent opacity={0.35} roughness={0.9} depthWrite={false} />
      </mesh>
      <Text font={FONT_URL} position={[0, 0, 0.01]} fontSize={0.42} color={INK} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#0d4d27">
        {translate('ui.approved')}
      </Text>
    </group>
  )
}

function Approved({ script, frame, reduced }: Props) {
  const t = outcomeTime(frame)
  const winner = script.outcome.winner
  const loser = script.fighters.find(f => f !== winner) ?? script.fighters[1]
  const x = sideSign(script, loser) * FIGHT_X
  return (
    <>
      <GiantStamp x={x} t={t} />
      {t >= STAMP_HIT_MS && <InkMark x={x} />}
      {t >= STAMP_HIT_MS && !reduced && <Confetti position={[0, 2.6, 0.5]} />}
      <pointLight position={[0, 2.5, 2]} color="#3ddc84" intensity={t >= STAMP_HIT_MS ? 30 : 0} distance={10} />
    </>
  )
}

function Trapdoor({ x, t }: { x: number; t: number }) {
  const open = Math.min(1, Math.max(0, t / 260))
  return (
    <group position={[x, 0.015, 0]} rotation-x={-Math.PI / 2}>
      <mesh scale={open}>
        <circleGeometry args={[0.85, 40]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh scale={open}>
        <ringGeometry args={[0.85, 1.0, 40]} />
        <meshStandardMaterial color="#f5c400" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Shutter({ t }: { t: number }) {
  const k = Math.min(1, Math.max(0, (t - SHUTTER_MS) / 260))
  const y = SHUTTER_TOP - (SHUTTER_TOP - SHUTTER_BOTTOM) * k * k
  return (
    <group position={[0, y, BOOTH_Z + 0.45]}>
      <mesh castShadow>
        <boxGeometry args={[2.9, 2.1, 0.05]} />
        <meshStandardMaterial color="#8d9399" metalness={0.75} roughness={0.35} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, -0.95 + i * 0.24, 0.03]}>
          <boxGeometry args={[2.9, 0.03, 0.02]} />
          <meshStandardMaterial color="#5f656b" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, -0.35, 0.05]}>
        <planeGeometry args={[1.5, 0.42]} />
        <meshStandardMaterial color="#c1121f" />
      </mesh>
      <Text font={FONT_URL} position={[0, -0.35, 0.06]} fontSize={0.24} color="#ffffff" anchorX="center" anchorY="middle">
        {translate('ui.closed')}
      </Text>
    </group>
  )
}

function Siren({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    if (!reduced) group.current.rotation.set(0, clock.elapsedTime * 7, 0)
    if (light.current) light.current.intensity = reduced ? 12 : 22 + Math.sin(clock.elapsedTime * 14) * 14
  })
  return (
    <group position={[0, 3.6, -1.2]}>
      <group ref={group}>
        <pointLight ref={light} position={[0.8, 0, 0]} color="#ff1a1a" distance={12} />
      </group>
      <mesh>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshBasicMaterial color="#ff2a2a" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Closed({ script, frame, reduced }: Props) {
  const t = outcomeTime(frame)
  const winner = script.outcome.winner
  const loser = script.fighters.find(f => f !== winner) ?? script.fighters[1]
  const x = sideSign(script, loser) * FIGHT_X
  const visible = t < TRAPDOOR_DROP_MS + 1400
  return (
    <>
      {visible && <Trapdoor x={x} t={t} />}
      <Shutter t={t} />
      {t >= SHUTTER_MS && <Siren reduced={reduced} />}
    </>
  )
}

function DustRing({ x }: { x: number }) {
  const mesh = useRef<Mesh>(null)
  const born = useRef<number | null>(null)
  useFrame(({ clock }) => {
    if (!mesh.current) return
    born.current ??= clock.elapsedTime
    const t = clock.elapsedTime - born.current
    mesh.current.scale.setScalar(0.5 + t * 3)
    mesh.current.visible = t < 0.7
  })
  return (
    <mesh ref={mesh} position={[x, 0.04, 0]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.6, 0.9, 32]} />
      <meshBasicMaterial color="#d8c8b0" transparent opacity={0.45} depthWrite={false} />
    </mesh>
  )
}

export function FinisherFx({ script, frame, reduced }: Props) {
  if (frame.phase !== 'outcome' && frame.phase !== 'done') return null
  if (script.outcome.kind === 'approved') {
    const loser = script.fighters.find(f => f !== script.outcome.winner) ?? script.fighters[1]
    return (
      <>
        <Approved script={script} frame={frame} reduced={reduced} />
        {outcomeTime(frame) >= STAMP_HIT_MS && frame.phase === 'outcome' && <DustRing x={sideSign(script, loser) * FIGHT_X} />}
      </>
    )
  }
  if (script.outcome.kind === 'closed') return <Closed script={script} frame={frame} reduced={reduced} />
  return null
}
