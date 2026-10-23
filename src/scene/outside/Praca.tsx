'use client'

import { useMemo } from 'react'
import type { PropPlacement } from '@/types/scene'
import { InstancedProp } from '../hall/InstancedProp'
import { FAR_SIDEWALK, SIDEWALK_Y } from './street'
import { seeded } from './textures'

const NEAR = FAR_SIDEWALK.near + 4.5
const DEPTH = 40
const WIDTH = 120
const CORETO = { x: -8, z: NEAR + 12 }

function trees(): PropPlacement[] {
  const random = seeded(23)
  const spots: PropPlacement[] = []
  for (let x = -WIDTH / 2 + 4; x < WIDTH / 2; x += 7) {
    for (let z = NEAR + 3; z < NEAR + DEPTH; z += 8) {
      const px = x + (random() - 0.5) * 3
      const pz = z + (random() - 0.5) * 3
      if (Math.hypot(px - CORETO.x, pz - CORETO.z) < 7) continue
      spots.push({ position: [px, SIDEWALK_Y, pz], rotation: random() * 6, scale: 0.9 + random() * 0.5 })
    }
  }
  return spots
}

function Coreto() {
  const columns = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2)
  return (
    <group position={[CORETO.x, SIDEWALK_Y, CORETO.z]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.4, 3.6, 0.7, 8]} />
        <meshStandardMaterial color="#efe6d2" roughness={0.8} />
      </mesh>
      {columns.map(angle => (
        <mesh key={angle} position={[Math.cos(angle) * 3, 1.95, Math.sin(angle) * 3]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 2.5, 8]} />
          <meshStandardMaterial color="#f7f3ea" />
        </mesh>
      ))}
      <mesh position={[0, 3.75, 0]} castShadow>
        <coneGeometry args={[3.9, 1.6, 8]} />
        <meshStandardMaterial color="#c8553d" roughness={0.6} />
      </mesh>
    </group>
  )
}

export function Praca() {
  const spots = useMemo(() => trees(), [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, SIDEWALK_Y + 0.01, NEAR + DEPTH / 2]} receiveShadow>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshStandardMaterial color="#7fa65a" roughness={1} />
      </mesh>
      <InstancedProp id="tree-fat" placements={spots} colors={{ leafsGreen: '#4f8f3e', woodBark: '#6b4a35' }} />
      <Coreto />
    </group>
  )
}
