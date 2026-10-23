'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, DoubleSide, type Group } from 'three'
import { actorObject } from '../actorRegistry'
import { useReducedMotion } from '../render/useReducedMotion'
import { jumpSignTexture } from './eggTextures'

const ABOVE = 2.62
const SPIN = 9

export function Beacon({ reduced, scale = 1 }: { reduced: boolean; scale?: number }) {
  const beam = useRef<Group>(null)
  useFrame(({ clock }) => beam.current?.rotation.set(0, reduced ? 0.6 : clock.elapsedTime * SPIN, 0))
  return (
    <group scale={scale}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.1, 12]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff2a1a" emissive="#ff1a0a" emissiveIntensity={reduced ? 2.5 : 5} toneMapped={false} />
      </mesh>
      {!reduced && (
        <group ref={beam} position={[0, 0.17, 0]}>
          {[1, -1].map(side => (
            <mesh key={side} position={[side * 0.75, 0, 0]} rotation-z={(side * Math.PI) / 2}>
              <coneGeometry args={[0.3, 1.4, 16, 1, true]} />
              <meshBasicMaterial color="#ff3b2f" transparent opacity={0.35} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

// Follows the queue jumper: a hazard sign with a spinning police light on top.
export function JumpSign({ actorId }: { actorId: string }) {
  const ref = useRef<Group>(null)
  const reduced = useReducedMotion()
  const texture = useMemo(() => jumpSignTexture(), [])
  useFrame(({ clock }) => {
    const group = ref.current
    const target = actorObject(actorId)
    if (!group) return
    group.visible = !!target
    if (target) group.position.set(target.position.x, target.position.y + ABOVE + (reduced ? 0 : Math.sin(clock.elapsedTime * 10) * 0.04), target.position.z)
  })
  return (
    <group ref={ref} visible={false}>
      <mesh>
        <boxGeometry args={[1.05, 0.36, 0.03]} />
        <meshStandardMaterial color="#ffd400" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.017]}>
        <planeGeometry args={[1.05, 0.36]} />
        <meshStandardMaterial map={texture} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.35} roughness={0.6} />
      </mesh>
      <group position={[0, 0.18, 0]}>
        <Beacon reduced={reduced} />
      </group>
    </group>
  )
}
