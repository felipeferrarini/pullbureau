'use client'

import { t } from '@/i18n'
import { BUSINESS_HOURS_LABEL } from '@/i18n/uiFormat'


import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { ENTRANCE_HALF, FACADE_Z } from '../layout'
import { actorObjects } from '../actorRegistry'
import { FONT_URL } from '../fonts'
import { DOOR_OPEN_S } from '../walkIn/introTimeline'
import { introElapsed, isIntroPlaying } from '../walkIn/introStore'
import { DYNAMIC } from '../render/batchMeshes'
import { Cutaway } from './Cutaway'

const SENSOR_RADIUS = 2.2
const SLIDE_RATE = 3.2
const FRAME = '#c9ced3'
const GLASS = '#bfe3ef'

function someoneNearby(): boolean {
  for (const object of actorObjects()) {
    if (Math.abs(object.position.x) < ENTRANCE_HALF + 0.6 && Math.abs(object.position.z - FACADE_Z) < SENSOR_RADIUS) return true
  }
  return false
}

function shouldOpen(): boolean {
  if (isIntroPlaying()) return introElapsed() >= DOOR_OPEN_S
  return someoneNearby()
}

function Panel({ width, height, side, label }: { width: number; height: number; side: -1 | 1; label: boolean }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]} renderOrder={3}>
        <boxGeometry args={[width - 0.06, height - 0.06, 0.02]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.3} roughness={0.04} metalness={0.2} depthWrite={false} />
      </mesh>
      {[0.03, height - 0.03].map(y => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[width, 0.07, 0.05]} />
          <meshStandardMaterial color={FRAME} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {[-1, 1].map(edge => (
        <mesh key={edge} position={[(edge * width) / 2, height / 2, 0]}>
          <boxGeometry args={[0.05, height, 0.05]} />
          <meshStandardMaterial color={FRAME} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[-side * (width / 2 - 0.18), 1.05, 0.05]}>
        <boxGeometry args={[0.04, 0.7, 0.04]} />
        <meshStandardMaterial color="#e6e8ea" metalness={0.8} roughness={0.25} />
      </mesh>
      {label && side === -1 && (
        <group position={[0, 1.55, 0.02]}>
          <Text font={FONT_URL} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle" letterSpacing={0.08}>
            {t('ui.service')}
          </Text>
          <Text font={FONT_URL} position={[0, -0.17, 0]} fontSize={0.15} color="#ffffff" anchorX="center" anchorY="middle">
            {BUSINESS_HOURS_LABEL}
          </Text>
          <Text font={FONT_URL} position={[0, -0.33, 0]} fontSize={0.075} color="#ffffff" anchorX="center" anchorY="middle" letterSpacing={0.1}>
            {t('ui.mondayToFriday')}
          </Text>
        </group>
      )}
      {label && side === 1 && (
        <Text font={FONT_URL} position={[0, 1.45, 0.02]} fontSize={0.09} color="#ffffff" anchorX="center" anchorY="middle" letterSpacing={0.1}>
          {t('ui.entrance')}
        </Text>
      )}
    </group>
  )
}

const LEAVES = [
  { side: -1, inner: false },
  { side: -1, inner: true },
  { side: 1, inner: true },
  { side: 1, inner: false },
] as const

// Four sliding leaves: closed they fill the wide doorway, open they stack outside it on both sides.
export function GlassDoors({ width, height }: { width: number; height: number }) {
  const leaves = useRef<(Group | null)[]>([])
  const open = useRef(0)
  const leaf = width / LEAVES.length
  const closedX = (i: number) => (i + 0.5) * leaf - width / 2
  const openX = (side: number) => side * (width / 2 + leaf / 2 - 0.1)

  useFrame((_, delta) => {
    const goal = shouldOpen() ? 1 : 0
    open.current += Math.sign(goal - open.current) * Math.min(Math.abs(goal - open.current), SLIDE_RATE * delta * 0.5)
    const eased = open.current * open.current * (3 - 2 * open.current)
    LEAVES.forEach(({ side }, i) => {
      const group = leaves.current[i]
      if (group) group.position.setX(closedX(i) + (openX(side) - closedX(i)) * eased)
    })
  })

  return (
    <Cutaway>
      <group position={[0, 0, 0.17]}>
        {LEAVES.map(({ side, inner }, i) => (
          <group
            key={i}
            ref={group => {
              leaves.current[i] = group
            }}
            userData={DYNAMIC}
            position={[closedX(i), 0, inner ? 0.05 : 0]}
          >
            <Panel width={leaf} height={height} side={side} label={inner} />
          </group>
        ))}
      </group>
      <mesh position={[0, height + 0.06, 0.17]}>
        <boxGeometry args={[width + 0.2, 0.14, 0.14]} />
        <meshStandardMaterial color={FRAME} metalness={0.7} roughness={0.3} />
      </mesh>
    </Cutaway>
  )
}
