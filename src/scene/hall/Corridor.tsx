'use client'

import { t } from '@/i18n'


import { Sparkles, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { DYNAMIC } from '../render/batchMeshes'
import { useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import { FONT_URL } from '../fonts'
import { BACK_WALL_Z, FACADE_Z, corridorStartX, corridorWidth } from '../layout'
import { useReducedMotion } from '../render/useReducedMotion'
import { hallColors } from './colors'
import { GraniliteFloor } from './Floor'
import { InstancedProp } from './InstancedProp'
import { Wall } from './Walls'

const DEPTH = FACADE_Z - BACK_WALL_Z
const CENTER_Z = (FACADE_Z + BACK_WALL_Z) / 2
const PAINT = '#d6ccb4'
const BAND = '#6c8471'
const GAP_FROM_CORRIDOR = { from: -6.2, to: -3.2, height: 2.6 }

function FlickeringBulb({ x, z }: { x: number; z: number }) {
  const material = useRef<MeshStandardMaterial>(null)
  const reduced = useReducedMotion()
  useFrame(({ clock }) => {
    if (!material.current) return
    const t = clock.elapsedTime
    const off = !reduced && (Math.sin(t * 13.7) > 0.93 || (t % 7 > 6.2 && Math.sin(t * 40) > 0))
    material.current.emissiveIntensity = off ? 0.05 : 3
  })
  return (
    <group position={[x, 4.4, z]}>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 2.6, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh userData={DYNAMIC}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial ref={material} color="#fff6da" emissive="#ffe6a8" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}

export function Corridor({ count, closedCount }: { count: number; closedCount: number }) {
  const start = corridorStartX(count)
  const width = corridorWidth(closedCount)
  const centerX = start + width / 2
  const end = start + width
  return (
    <group>
      <GraniliteFloor centerX={centerX} width={width + 0.2} depth={DEPTH} centerZ={CENTER_Z} tone="dusty" />
      <Wall length={width + 0.4} position={[centerX, 0, BACK_WALL_Z]} rotation={0} paint={PAINT} band={BAND} />
      <Wall length={DEPTH} position={[end + 0.1, 0, CENTER_Z]} rotation={-Math.PI / 2} paint={PAINT} band={BAND} />
      <Wall length={DEPTH} position={[start - 0.1, 0, CENTER_Z]} rotation={Math.PI / 2} paint={PAINT} band={BAND} gap={GAP_FROM_CORRIDOR} skinOnly />
      <FlickeringBulb x={centerX} z={-4} />
      <InstancedProp
        id="box-open"
        placements={[
          { position: [end - 0.6, 0, FACADE_Z - 2], rotation: 0.4 },
          { position: [end - 0.7, 0, FACADE_Z - 3.1], rotation: -0.2 },
        ]}
      />
      <InstancedProp id="box-closed" placements={[{ position: [end - 0.5, 0, FACADE_Z - 2.5] }, { position: [end - 0.55, 0.56, FACADE_Z - 2.45], rotation: 0.5 }]} />
      <InstancedProp id="chair-plain" placements={[{ position: [end - 1.2, 0.2, FACADE_Z - 4.5], rotation: 1.2 }]} colors={{ wood: '#8a7a66' }} />
      <Sparkles count={120} scale={[width, 4, DEPTH * 0.8]} position={[centerX, 2.2, CENTER_Z + 2]} size={2.5} speed={0.12} opacity={0.4} color={hallColors.dust} noise={0.8} />
      <group position={[start + 0.15, 3.1, FACADE_Z - 3.2]} rotation-y={Math.PI / 2}>
        <mesh>
          <boxGeometry args={[2.6, 0.42, 0.05]} />
          <meshStandardMaterial color="#3f4a45" roughness={0.6} />
        </mesh>
        <Text font={FONT_URL} position={[0, 0, 0.03]} fontSize={0.17} color="#e8e2cf" anchorX="center" anchorY="middle">
          {t('ui.closedCounters')}
        </Text>
      </group>
    </group>
  )
}
