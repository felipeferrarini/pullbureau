'use client'

import { t } from '@/i18n'

import { Billboard, Sparkles, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, PointLight } from 'three'
import { formatDate } from '@/shared/format'
import type { StrikeSign } from '@/types/eggs'
import type { Actor } from '@/types/scene'
import { BirthdayCake } from './eggs/Birthday'
import { CardboardSign } from './eggs/StrikeProps'
import { FONT_URL } from './fonts'
import { palette } from './palette'
import { PLUMBOB_SEATED_Y, PLUMBOB_Y, Plumbob } from './Plumbob'
import { useLiteScene } from './render/quality'
import { useReducedMotion } from './render/useReducedMotion'

const HEAD_Y = 2.15

function Snore() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 1.55 + Math.sin(clock.elapsedTime * 2) * 0.08
  })
  return (
    <group ref={ref} position={[0.35, 1.55, 0]}>
      <Billboard>
        <Text font={FONT_URL} fontSize={0.18} color="#5c677d" anchorX="left">
          Zzz
        </Text>
      </Billboard>
    </group>
  )
}

function ViewerRing({ label }: { label: string | null }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.45, 0.6, 32]} />
        <meshStandardMaterial color={palette.pending} emissive={palette.pending} emissiveIntensity={1} />
      </mesh>
      {label && (
        <Billboard position={[0, HEAD_Y + 0.35, 0]}>
          <Text font={FONT_URL} fontSize={0.2} color={palette.pending} outlineWidth={0.015} outlineColor={palette.text} anchorX="center">
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}

function Memorial({ since }: { since: string }) {
  const light = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    if (light.current) light.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 13) * 0.4 + Math.sin(clock.elapsedTime * 7) * 0.3
  })
  return (
    <group position={[0.55, 0, 0.35]}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.24, 12]} />
        <meshStandardMaterial color={palette.paper} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <coneGeometry args={[0.03, 0.08, 8]} />
        <meshStandardMaterial color="#ffb703" emissive="#ffb703" emissiveIntensity={2} />
      </mesh>
      <pointLight ref={light} position={[0, 0.4, 0]} color="#ffb703" distance={2.5} />
      <Billboard position={[0, 0.65, 0.2]}>
        <Text font={FONT_URL} fontSize={0.09} maxWidth={1.4} textAlign="center" color={palette.text} outlineWidth={0.006} outlineColor={palette.paper} anchorX="center">
          {t('ui.inMemoriam', { date: formatDate(since) })}
        </Text>
      </Billboard>
    </group>
  )
}

function DustMotes({ count, seated, reduced }: { count: number; seated: boolean; reduced: boolean }) {
  return (
    <Sparkles
      count={count}
      scale={[1, seated ? 1.2 : 1.6, 1]}
      position={[0, seated ? 0.85 : 1.1, 0]}
      size={reduced ? 2 : 2.6}
      speed={reduced ? 0 : 0.18}
      noise={0.5}
      opacity={0.5}
      color="#e4d8bd"
    />
  )
}

type DecorationsProps = { actor: Actor; focused: boolean; isViewer: boolean; sign: StrikeSign | null; memorialSince: string | null; birthday: number | null; motes: number }

const SEATED: Actor['pose'][] = ['sitting', 'sleeping']

export function ActorDecorations({ actor, focused, isViewer, sign, memorialSince, birthday, motes }: DecorationsProps) {
  const seated = SEATED.includes(actor.pose) || actor.kind === 'waiting'
  const lite = useLiteScene()
  const reduced = useReducedMotion()
  return (
    <>
      {actor.pr && !sign && <Plumbob pr={actor.pr} height={seated ? PLUMBOB_SEATED_Y : PLUMBOB_Y} showLabel={focused} dusty={actor.dusty} />}
      {actor.pose === 'sleeping' && !sign && <Snore />}
      {isViewer && <ViewerRing label={actor.kind === 'attendant' ? t('ui.you') : null} />}
      {sign && <CardboardSign sign={sign} seated={seated} />}
      {memorialSince && <Memorial since={memorialSince} />}
      {birthday !== null && <BirthdayCake months={birthday} />}
      {motes > 0 && !lite && <DustMotes count={motes} seated={seated} reduced={reduced} />}
    </>
  )
}
