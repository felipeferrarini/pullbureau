'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { type InstancedMesh, Object3D } from 'three'
import { COFFEE_MACHINE_OFFSET } from '@/eggs/coffee'
import { BACK_WALL_Z, hallWidth } from '../layout'
import { useReducedMotion } from '../render/useReducedMotion'
import { plateTexture } from './eggTextures'

const PLATE_W = 0.95
const PLATE_H = 0.29

// A little acrylic easel on the counter: a localized coffee-break notice.
export function AwayPlate() {
  const texture = useMemo(() => plateTexture(), [])
  return (
    <group position={[0.2, 1.08, 0.3]} rotation-x={-0.32}>
      <mesh position={[0, PLATE_H / 2, -0.01]}>
        <boxGeometry args={[PLATE_W + 0.04, PLATE_H + 0.04, 0.012]} />
        <meshStandardMaterial color="#d9dee2" transparent opacity={0.65} roughness={0.1} />
      </mesh>
      <mesh position={[0, PLATE_H / 2, 0]}>
        <planeGeometry args={[PLATE_W, PLATE_H]} />
        <meshStandardMaterial map={texture} roughness={0.5} />
      </mesh>
    </group>
  )
}

export function CoffeeCup() {
  return (
    <group position={[0, 0.02, 0.05]}>
      <mesh>
        <cylinderGeometry args={[0.045, 0.036, 0.08, 12]} />
        <meshStandardMaterial color="#fbfbf8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.036, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.04, 12]} />
        <meshStandardMaterial color="#3b2416" roughness={0.3} />
      </mesh>
    </group>
  )
}

const PUFFS = 14
const RISE_S = 2.6

export function CoffeeSteam({ hallCount }: { hallCount: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const reduced = useReducedMotion()
  const dummy = useMemo(() => new Object3D(), [])
  const left = -hallWidth(hallCount) / 2
  const [dx, y, dz] = COFFEE_MACHINE_OFFSET
  useFrame(({ clock }) => {
    const instances = mesh.current
    if (!instances) return
    for (let i = 0; i < PUFFS; i++) {
      const k = reduced ? i / PUFFS : ((clock.elapsedTime / RISE_S + i / PUFFS) % 1)
      dummy.position.set(Math.sin(k * 6 + i) * 0.06, k * 0.9, Math.cos(k * 5 + i) * 0.04)
      dummy.scale.setScalar((0.05 + k * 0.16) * Math.sin(Math.PI * k))
      dummy.updateMatrix()
      instances.setMatrixAt(i, dummy.matrix)
    }
    instances.instanceMatrix.needsUpdate = true
  })
  return (
    <group position={[left + dx, y, BACK_WALL_Z + 0.1 + dz]}>
      <instancedMesh ref={mesh} args={[undefined, undefined, PUFFS]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.55} roughness={1} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
