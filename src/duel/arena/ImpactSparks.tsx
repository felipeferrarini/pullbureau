'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, DoubleSide, type InstancedMesh, type Mesh, type MeshBasicMaterial, Object3D } from 'three'
import type { Vec3 } from '@/types/scene'

const COUNT = 46
const LIFE_S = 0.6
const GRAVITY = -7
const HOT = [new Color('#fff6d5').multiplyScalar(7), new Color('#ffcf4a').multiplyScalar(6), new Color('#ff7a1a').multiplyScalar(5)]
const FLASH = new Color('#fff2c4').multiplyScalar(5)

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

type Props = { position: Vec3; direction: number; power: number }

export function ImpactSparks({ position, direction, power }: Props) {
  const sparks = useRef<InstancedMesh>(null)
  const flash = useRef<Mesh>(null)
  const ring = useRef<Mesh>(null)
  const flashMaterial = useRef<MeshBasicMaterial>(null)
  const ringMaterial = useRef<MeshBasicMaterial>(null)
  const born = useRef<number | null>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const seeds = useMemo(() => {
    const random = seeded(Math.floor(position[0] * 1000) + 7)
    return Array.from({ length: COUNT }, () => {
      const angle = (random() - 0.5) * Math.PI * 1.3
      const speed = (2.5 + random() * 4.5) * power
      return { vx: Math.cos(angle) * speed * direction, vy: Math.sin(angle) * speed + 1.2, vz: (random() - 0.5) * 3 * power, length: 0.08 + random() * 0.16 }
    })
  }, [position, direction, power])

  useLayoutEffect(() => {
    const mesh = sparks.current
    if (!mesh) return
    seeds.forEach((_, i) => mesh.setColorAt(i, HOT[i % HOT.length]))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [seeds])

  useFrame(({ clock }) => {
    born.current ??= clock.elapsedTime
    const t = clock.elapsedTime - born.current
    const fade = Math.max(0, 1 - t / LIFE_S)
    const mesh = sparks.current
    if (mesh) {
      seeds.forEach((seed, i) => {
        const vy = seed.vy + GRAVITY * t
        dummy.position.set(position[0] + seed.vx * t, position[1] + seed.vy * t + (GRAVITY * t * t) / 2, position[2] + seed.vz * t)
        dummy.rotation.set(0, 0, Math.atan2(vy, seed.vx))
        dummy.scale.set(seed.length * (0.5 + fade), 0.025 * fade + 0.002, 1)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    const pop = Math.min(1, t / 0.07)
    flash.current?.scale.setScalar((0.25 + pop * 0.9) * power)
    flashMaterial.current?.color.copy(FLASH).multiplyScalar(Math.max(0, 1 - t / 0.16))
    ring.current?.scale.setScalar(0.2 + t * 4 * power)
    ringMaterial.current?.color.copy(FLASH).multiplyScalar(Math.max(0, 0.6 - t * 1.8))
  })

  return (
    <group>
      <instancedMesh ref={sparks} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} blending={AdditiveBlending} depthWrite={false} transparent side={DoubleSide} />
      </instancedMesh>
      <mesh ref={flash} position={position} rotation-z={0.4}>
        <circleGeometry args={[0.32, 4]} />
        <meshBasicMaterial ref={flashMaterial} toneMapped={false} blending={AdditiveBlending} depthWrite={false} transparent />
      </mesh>
      <mesh ref={ring} position={position}>
        <ringGeometry args={[0.42, 0.5, 32]} />
        <meshBasicMaterial ref={ringMaterial} toneMapped={false} blending={AdditiveBlending} depthWrite={false} transparent side={DoubleSide} />
      </mesh>
    </group>
  )
}
