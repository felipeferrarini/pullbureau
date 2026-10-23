'use client'

import { t } from '@/i18n'
import { DEPLOYMENT_TIME_ZONE } from '@/i18n/uiFormat'


import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { DYNAMIC } from '../render/batchMeshes'
import { useRef } from 'react'
import type { Group } from 'three'
import type { Vec3 } from '@/types/scene'
import { FONT_URL } from '../fonts'
import { useReducedMotion } from '../render/useReducedMotion'
import { clockHands } from './clockHands'
import { hallColors } from './colors'
import { SingleProp } from './InstancedProp'

type PosterProps = { position: Vec3; rotation?: number; width: number; height: number; title: string; body?: string; accent: string; tilt?: number }

export function Poster({ position, rotation = 0, width, height, title, body, accent, tilt = 0 }: PosterProps) {
  return (
    <group position={position} rotation={[0, rotation, tilt]}>
      <mesh castShadow>
        <boxGeometry args={[width, height, 0.01]} />
        <meshStandardMaterial color={hallColors.poster} roughness={0.95} />
      </mesh>
      <mesh position={[0, height / 2 - 0.09, 0.006]}>
        <planeGeometry args={[width - 0.08, 0.1]} />
        <meshStandardMaterial color={accent} roughness={0.9} />
      </mesh>
      <Text font={FONT_URL} position={[0, body ? 0.06 : -0.02, 0.008]} fontSize={0.15} maxWidth={width - 0.16} lineHeight={1.05} textAlign="center" color={accent} anchorX="center" anchorY="middle">
        {title}
      </Text>
      {body && (
        <Text font={FONT_URL} position={[0, -height / 2 + 0.14, 0.008]} fontSize={0.07} maxWidth={width - 0.16} textAlign="center" color="#4a4a44" anchorX="center" anchorY="middle">
          {body}
        </Text>
      )}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (width / 2 - 0.05), height / 2 - 0.05, 0.008]}>
          <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
      ))}
    </group>
  )
}

const MARKS = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2)

export function WallClock({ position }: { position: Vec3 }) {
  const hour = useRef<Group>(null)
  const minute = useRef<Group>(null)
  const second = useRef<Group>(null)
  useFrame(() => {
    const hands = clockHands(new Date())
    if (hour.current) hour.current.rotation.z = -hands.hour
    if (minute.current) minute.current.rotation.z = -hands.minute
    if (second.current) second.current.rotation.z = -hands.second
  })
  return (
    <group position={position}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.1, 40]} />
        <meshStandardMaterial color={hallColors.clockRim} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.051]}>
        <circleGeometry args={[0.55, 40]} />
        <meshStandardMaterial color="#fbfaf4" roughness={0.6} />
      </mesh>
      {MARKS.map(angle => (
        <mesh key={angle} position={[Math.sin(angle) * 0.47, Math.cos(angle) * 0.47, 0.055]} rotation-z={-angle}>
          <boxGeometry args={[0.025, angle % (Math.PI / 2) < 0.01 ? 0.1 : 0.06, 0.005]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      <group ref={hour} userData={DYNAMIC} position={[0, 0, 0.06]}>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.045, 0.28, 0.01]} />
          <meshStandardMaterial color="#1d1d1d" />
        </mesh>
      </group>
      <group ref={minute} userData={DYNAMIC} position={[0, 0, 0.068]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.03, 0.42, 0.01]} />
          <meshStandardMaterial color="#1d1d1d" />
        </mesh>
      </group>
      <group ref={second} userData={DYNAMIC} position={[0, 0, 0.076]}>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[0.012, 0.44, 0.006]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.082]}>
        <circleGeometry args={[0.03, 16]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
      <Text font={FONT_URL} position={[0, -0.24, 0.056]} fontSize={0.055} color="#6b6b63" anchorX="center">
        {t('ui.timeZoneClock', { timeZone: DEPLOYMENT_TIME_ZONE })}
      </Text>
    </group>
  )
}

export function WaterCooler({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 1, 0.42]} />
        <meshStandardMaterial color={hallColors.cooler} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.72, 0.212]}>
        <boxGeometry args={[0.3, 0.22, 0.01]} />
        <meshStandardMaterial color="#d9dcd6" roughness={0.5} />
      </mesh>
      {[
        [-0.07, '#2f80ed'],
        [0.07, '#e74c3c'],
      ].map(([x, color]) => (
        <mesh key={String(x)} position={[Number(x), 0.74, 0.23]}>
          <boxGeometry args={[0.05, 0.06, 0.05]} />
          <meshStandardMaterial color={String(color)} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.58, 0.18]}>
        <boxGeometry args={[0.26, 0.02, 0.1]} />
        <meshStandardMaterial color="#9aa0a3" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.04, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.08, 20]} />
        <meshStandardMaterial color={hallColors.cooler} />
      </mesh>
      <mesh position={[0, 1.33, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.46, 24]} />
        <meshStandardMaterial color={hallColors.coolerWater} transparent opacity={0.55} roughness={0.05} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hallColors.coolerWater} transparent opacity={0.55} roughness={0.05} />
      </mesh>
      <mesh position={[0.28, 0.95, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.36, 12]} />
        <meshStandardMaterial color="#f7f7f2" />
      </mesh>
    </group>
  )
}

const FAN_SCALE = 1.6
const FAN_COLORS = { wood: '#6b4a32', metalLight: '#e8e4da', lamp: '#fff4d6' }

export function CeilingFan({ position, speed = 3 }: { position: Vec3; speed?: number }) {
  const spinner = useRef<Group>(null)
  const reduced = useReducedMotion()
  useFrame((_, delta) => {
    if (spinner.current) spinner.current.rotation.y += delta * (reduced ? speed * 0.25 : speed)
  })
  const top = 7 - position[1]
  return (
    <group position={position}>
      <mesh position={[0, top / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, top, 6]} />
        <meshStandardMaterial color="#666" metalness={0.5} roughness={0.4} />
      </mesh>
      <group ref={spinner} userData={DYNAMIC}>
        <SingleProp id="ceiling-fan" position={[0, -0.27 * FAN_SCALE, 0]} scale={FAN_SCALE} shadows={false} colors={FAN_COLORS} />
      </group>
    </group>
  )
}

export function PendantLamp({ position }: { position: Vec3 }) {
  const top = 7 - position[1]
  return (
    <group position={position}>
      <mesh position={[0, top / 2, 0]}>
        <cylinderGeometry args={[0.008, 0.008, top, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <coneGeometry args={[0.34, 0.24, 20, 1, true]} />
        <meshStandardMaterial color="#2f5d46" roughness={0.5} metalness={0.2} side={2} />
      </mesh>
      <mesh position={[0, -0.13, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#fff3d1" emissive="#ffe3a3" emissiveIntensity={4} />
      </mesh>
    </group>
  )
}

export function Totem({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.6, 1.3, 0.45]} />
        <meshStandardMaterial color={hallColors.signGreen} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.22, 0.05]} rotation-x={-0.5} castShadow>
        <boxGeometry args={[0.56, 0.4, 0.06]} />
        <meshStandardMaterial color="#202624" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.235, 0.085]} rotation-x={-0.5}>
        <planeGeometry args={[0.46, 0.3]} />
        <meshStandardMaterial color="#9fe3c1" emissive="#7fe0b1" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0.85, 0.23]}>
        <boxGeometry args={[0.2, 0.03, 0.02]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.8, 0.245]} rotation-x={0.3}>
        <planeGeometry args={[0.07, 0.1]} />
        <meshStandardMaterial color="#fffdf2" />
      </mesh>
      <Text font={FONT_URL} position={[0, 1.75, 0]} fontSize={0.15} color={hallColors.signGreen} outlineWidth={0.012} outlineColor="#ffffff" anchorX="center">
        {t('ui.takeATicket')}
      </Text>
    </group>
  )
}

export function BackDoor({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[1.3, 2.25, 0.06]} />
        <meshStandardMaterial color="#8b6b4a" roughness={0.6} />
      </mesh>
      <mesh position={[0.45, 1.05, 0.05]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#d4b26a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0.04]}>
        <boxGeometry args={[0.8, 0.26, 0.05]} />
        <meshStandardMaterial color="#1e8449" emissive="#2ecc71" emissiveIntensity={1.6} />
      </mesh>
      <Text font={FONT_URL} position={[0, 2.5, 0.07]} fontSize={0.16} color="#ffffff" anchorX="center" anchorY="middle">
        {t('ui.exit')}
      </Text>
    </group>
  )
}
