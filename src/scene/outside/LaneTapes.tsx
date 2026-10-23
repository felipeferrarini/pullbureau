'use client'

import { t } from '@/i18n'

import { Text } from '@react-three/drei'
import type { LaneTape } from '@/types/scene'
import { FONT_URL } from '../fonts'
import { RopeFence } from '../Stanchions'
import { SIDEWALK_Y } from './street'

const PLATE = { width: 0.78, height: 0.36, y: 1.3 }

function LaneSign({ tape, repo }: { tape: LaneTape; repo: string }) {
  const [x, z] = tape.sign
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, PLATE.y - 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
        <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, PLATE.y + PLATE.height / 2, 0]} castShadow>
        <boxGeometry args={[PLATE.width + 0.06, PLATE.height + 0.06, 0.03]} />
        <meshStandardMaterial color="#2b2f33" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, PLATE.y + PLATE.height * 0.72, 0.017]}>
        <planeGeometry args={[PLATE.width, PLATE.height * 0.56]} />
        <meshStandardMaterial color={tape.color} roughness={0.5} />
      </mesh>
      <mesh position={[0, PLATE.y + PLATE.height * 0.22, 0.017]}>
        <planeGeometry args={[PLATE.width, PLATE.height * 0.44]} />
        <meshStandardMaterial color="#fbf8f0" roughness={0.6} />
      </mesh>
      <Text font={FONT_URL} position={[0, PLATE.y + PLATE.height * 0.72, 0.022]} fontSize={0.12} letterSpacing={0.06} color="#ffffff" anchorX="center" anchorY="middle">
        {t('ui.counterNumber', { number: String(tape.index + 1).padStart(2, '0') })}
      </Text>
      <Text font={FONT_URL} position={[0, PLATE.y + PLATE.height * 0.22, 0.022]} fontSize={0.085} maxWidth={PLATE.width - 0.06} color="#1d2327" anchorX="center" anchorY="middle">
        {repo}
      </Text>
    </group>
  )
}

// Each lane that spills onto the sidewalk gets tape in its own colour and a sign with its counter.
export function LaneTapes({ tapes, repos }: { tapes: LaneTape[]; repos: string[] }) {
  return (
    <group position={[0, SIDEWALK_Y, 0]}>
      {tapes.map(tape => (
        <group key={tape.index}>
          <RopeFence rails={[tape.rail]} color={tape.color} />
          <LaneSign tape={tape} repo={repos[tape.index] ?? ''} />
        </group>
      ))}
    </group>
  )
}
