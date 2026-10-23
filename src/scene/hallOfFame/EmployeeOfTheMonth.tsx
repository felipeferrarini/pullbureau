'use client'

import { t } from '@/i18n'


import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { AdditiveBlending, Color, DoubleSide } from 'three'
import type { Vec3 } from '@/types/scene'
import { FONT_URL } from '../fonts'
import { AvatarPhoto, GOLD, GildedFrame, GoldMaterial, type Twinkle, Twinkles } from './pieces'
import { useGlossTexture } from './textures'

const WIDTH = 3.4
const HEIGHT = 3.35
const BORDER = 0.3
const OPENING: [number, number] = [WIDTH - BORDER * 2, HEIGHT - BORDER * 2]
const PHOTO = 1.85
const PHOTO_Y = 0.36
const PLAQUE: [number, number] = [2.4, 0.64]
const PLAQUE_Y = -1.0
const LAMP_GLOW = new Color('#ffe2a8').multiplyScalar(3)
const MAX_SLACKERS = 4

const STARS: Twinkle[] = [
  { position: [-1.95, 1.45, 0.2], size: 0.2, phase: 0 },
  { position: [1.9, 1.2, 0.2], size: 0.16, phase: 1.1 },
  { position: [-1.85, -0.5, 0.2], size: 0.13, phase: 2.0 },
  { position: [1.95, 0.1, 0.2], size: 0.22, phase: 0.6 },
  { position: [-0.9, 1.78, 0.2], size: 0.12, phase: 1.7 },
  { position: [1.05, 1.8, 0.2], size: 0.14, phase: 2.4 },
  { position: [-1.4, -1.85, 0.2], size: 0.15, phase: 0.3 },
  { position: [0.65, 1.0, 0.24], size: 0.18, phase: 1.4 },
]

function Glass() {
  const gloss = useGlossTexture()
  return (
    <group position={[0, 0, 0.09]}>
      <mesh>
        <planeGeometry args={OPENING} />
        <meshPhysicalMaterial color="#dfeff2" transparent opacity={0.1} roughness={0.04} metalness={0.2} clearcoat={1} envMapIntensity={2.2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={OPENING} />
        <meshBasicMaterial map={gloss} transparent opacity={0.32} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Plaque({ month, login }: { month: string; login: string | null }) {
  return (
    <group position={[0, PLAQUE_Y, 0.11]}>
      <mesh castShadow>
        <boxGeometry args={[PLAQUE[0], PLAQUE[1], 0.03]} />
        <meshStandardMaterial color="#c79a3d" metalness={0.85} roughness={0.32} envMapIntensity={1.3} />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[PLAQUE[0] - 0.08, PLAQUE[1] - 0.08]} />
        <meshStandardMaterial color="#b88a32" metalness={0.8} roughness={0.45} />
      </mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (PLAQUE[0] / 2 - 0.08), 0, 0.02]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.025, 0.025, 0.012, 10]} />
          <meshStandardMaterial color="#7a5a20" metalness={1} roughness={0.3} />
        </mesh>
      ))}
      <Text font={FONT_URL} position={[0, 0.15, 0.019]} fontSize={0.112} letterSpacing={0.03} color="#3d2a0c" anchorX="center" anchorY="middle">
        {t('ui.employeeMonth', { month })}
      </Text>
      <Text font={FONT_URL} position={[0, -0.1, 0.019]} fontSize={0.24} maxWidth={PLAQUE[0] - 0.2} color="#2e1f07" anchorX="center" anchorY="middle">
        {login ? `@${login}` : t('ui.vacant')}
      </Text>
    </group>
  )
}

function Rosette() {
  return (
    <group position={[-WIDTH / 2 + 0.28, HEIGHT / 2 - 0.3, 0.24]} rotation-z={0.25}>
      {[-0.13, 0.13].map(x => (
        <mesh key={x} position={[x, -0.45, -0.02]} rotation-z={x > 0 ? 0.32 : -0.32}>
          <planeGeometry args={[0.2, 0.65]} />
          <meshStandardMaterial color="#b3121f" roughness={0.6} side={DoubleSide} />
        </mesh>
      ))}
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 24]} />
        <meshStandardMaterial color="#c8102e" roughness={0.55} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.012]}>
        <torusGeometry args={[0.24, 0.035, 8, 24]} />
        <meshStandardMaterial color="#e63946" roughness={0.5} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.03]}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 24]} />
        <GoldMaterial />
      </mesh>
      <Text font={FONT_URL} position={[0, 0, 0.05]} fontSize={0.15} color="#5a3b05" anchorX="center" anchorY="middle">
        {t('ui.1st')}
      </Text>
    </group>
  )
}

function PictureLamp() {
  return (
    <group position={[0, HEIGHT / 2 + 0.08, 0.32]}>
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.07, 0.07, 1.5, 16]} />
        <meshStandardMaterial color="#8a6a2a" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.06, 0.02]}>
        <boxGeometry args={[1.4, 0.02, 0.08]} />
        <meshBasicMaterial color={LAMP_GLOW} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.16]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#8a6a2a" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  )
}

function PostIt({ slacking }: { slacking: string[] }) {
  const names = slacking.slice(0, MAX_SLACKERS).map(login => `· ${login}`)
  if (slacking.length > MAX_SLACKERS) names.push(`+${slacking.length - MAX_SLACKERS}`)
  const position: Vec3 = [WIDTH / 2 + 0.05, -HEIGHT / 2 + 0.3, 0.2]
  return (
    <group position={position} rotation-z={-0.17}>
      <mesh position={[0.03, -0.03, -0.01]}>
        <planeGeometry args={[1.05, 1.05]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[1.05, 1.05]} />
        <meshStandardMaterial color="#ffe14d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.51, 0.004]} rotation-z={0.08}>
        <planeGeometry args={[0.45, 0.13]} />
        <meshStandardMaterial color="#f4f1e6" transparent opacity={0.65} roughness={0.4} />
      </mesh>
      <Text font={FONT_URL} position={[-0.47, 0.33, 0.006]} fontSize={0.1} color="#1b3a8a" anchorX="left" anchorY="middle">
        {t('ui.optionalDayOff')}
      </Text>
      <Text font={FONT_URL} position={[-0.47, 0.22, 0.006]} fontSize={0.1} lineHeight={1.15} maxWidth={0.92} color="#1b3a8a" anchorX="left" anchorY="top">
        {names.length ? names.join('\n') : t('ui.nobody')}
      </Text>
    </group>
  )
}

type Props = { position: Vec3; login: string | null; month: string; slacking: string[] }

export function EmployeeOfTheMonth({ position, login, month, slacking }: Props) {
  const stars = useMemo(() => STARS, [])
  return (
    <group position={position}>
      <mesh position={[0.06, -0.08, -0.01]}>
        <planeGeometry args={[WIDTH + 0.1, HEIGHT + 0.1]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={OPENING} />
        <meshStandardMaterial color="#173d2b" roughness={0.95} />
      </mesh>
      <group position={[0, PHOTO_Y, 0.05]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[PHOTO + 0.09, PHOTO + 0.09]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
        </mesh>
        {login ? <AvatarPhoto login={login} size={PHOTO} /> : null}
      </group>
      <GildedFrame width={WIDTH} height={HEIGHT} border={BORDER} />
      <Glass />
      <Plaque month={month} login={login} />
      <Rosette />
      <PictureLamp />
      <PostIt slacking={slacking} />
      <Twinkles stars={stars} />
    </group>
  )
}
