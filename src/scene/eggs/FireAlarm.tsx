'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { type InstancedMesh, Object3D } from 'three'
import { useEggStore } from '@/eggs/eggStore'
import type { Vec3 } from '@/types/scene'
import { BACK_WALL_Z, FACADE_Z, WALL_HEIGHT, hallWidth } from '../layout'
import { useReducedMotion } from '../render/useReducedMotion'
import { Beacon } from './JumpSign'

const DROPS = 1100
const TOP = WALL_HEIGHT - 0.6
const FALL_SPEED = 7.5

const BEACON_Y = 5.3
const BEACON_Z = -2.2

// Strobes hang from the ceiling over the hall, where the overview camera looks.
function beaconSpots(count: number): Vec3[] {
  const span = Math.min(hallWidth(count) / 2 - 3, 14)
  return [-1, -1 / 3, 1 / 3, 1].map(k => [k * span, BEACON_Y, BEACON_Z])
}

function Rod() {
  return (
    <mesh position={[0, (WALL_HEIGHT - BEACON_Y) / 2 + 0.1, 0]}>
      <cylinderGeometry args={[0.02, 0.02, WALL_HEIGHT - BEACON_Y, 6]} />
      <meshStandardMaterial color="#555b60" metalness={0.6} roughness={0.4} />
    </mesh>
  )
}

function Sprinklers({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const half = hallWidth(count) / 2 - 1
  const drops = useMemo(
    () => Array.from({ length: DROPS }, (_, i) => ({ x: ((i * 0.6180339) % 1) * 2 - 1, z: ((i * 0.7548776) % 1), phase: (i * 0.5698403) % 1, speed: 0.85 + ((i * 0.37) % 0.3) })),
    [],
  )
  useFrame(({ clock }) => {
    const instances = mesh.current
    if (!instances) return
    drops.forEach((drop, i) => {
      const fall = (clock.elapsedTime * FALL_SPEED * drop.speed + drop.phase * TOP) % TOP
      dummy.position.set(drop.x * half, TOP - fall, BACK_WALL_Z + 2 + drop.z * (FACADE_Z - BACK_WALL_Z - 3.5))
      dummy.updateMatrix()
      instances.setMatrixAt(i, dummy.matrix)
    })
    instances.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, DROPS]} frustumCulled={false}>
      <boxGeometry args={[0.022, 0.34, 0.022]} />
      <meshBasicMaterial color="#d6efff" transparent opacity={0.75} depthWrite={false} />
    </instancedMesh>
  )
}

// Friday-deploy fire alarm: spinning beacons, sprinklers, and everyone looks up (see the alarm flag).
export function FireAlarm({ count }: { count: number }) {
  const reduced = useReducedMotion()
  const spots = useMemo(() => beaconSpots(count), [count])
  useEffect(() => {
    useEggStore.getState().setAlarm(true)
    return () => useEggStore.getState().setAlarm(false)
  }, [])
  return (
    <group>
      {spots.map(spot => (
        <group key={spot.join()} position={spot}>
          <Rod />
          <group rotation-x={Math.PI}>
            <Beacon reduced={reduced} scale={3} />
          </group>
        </group>
      ))}
      <Sprinklers count={count} />
    </group>
  )
}
