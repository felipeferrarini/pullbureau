'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, type InstancedMesh, Object3D, Shape } from 'three'
import { Billboard, Text } from '@react-three/drei'
import type { Group } from 'three'
import { FONT_URL } from '../fonts'

const COUNT = 12
const LIFE = 2.8

function heartShape(): Shape {
  const shape = new Shape()
  shape.moveTo(0, -0.5)
  shape.bezierCurveTo(-0.15, -0.35, -0.55, -0.1, -0.5, 0.18)
  shape.bezierCurveTo(-0.45, 0.45, -0.1, 0.5, 0, 0.22)
  shape.bezierCurveTo(0.1, 0.5, 0.45, 0.45, 0.5, 0.18)
  shape.bezierCurveTo(0.55, -0.1, 0.15, -0.35, 0, -0.5)
  return shape
}

// Hearts float up from the dog and fade; "auau!" pops above them.
export function Hearts({ bornAt }: { bornAt: number }) {
  const mesh = useRef<InstancedMesh>(null)
  const label = useRef<Group>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const shape = useMemo(() => heartShape(), [])
  const seeds = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({ angle: (i / COUNT) * Math.PI * 2, delay: (i % 4) * 0.12, speed: 0.55 + (i % 3) * 0.18, size: 0.09 + (i % 5) * 0.018 })), [])

  useFrame(({ clock, camera }) => {
    const instances = mesh.current
    const age = clock.elapsedTime - bornAt
    if (label.current) {
      label.current.visible = age < LIFE
      label.current.position.y = 1.05 + Math.min(0.25, age * 0.4)
    }
    if (!instances) return
    seeds.forEach((seed, i) => {
      const t = Math.max(0, age - seed.delay)
      const k = t / LIFE
      const scale = t <= 0 || k >= 1 ? 0 : seed.size * Math.min(1, t * 6) * (1 - k * k)
      dummy.position.set(Math.cos(seed.angle) * (0.15 + t * 0.12) + Math.sin(t * 3 + i) * 0.06, 0.6 + t * seed.speed, Math.sin(seed.angle) * (0.15 + t * 0.12))
      dummy.quaternion.copy(camera.quaternion)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      instances.setMatrixAt(i, dummy.matrix)
    })
    instances.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <shapeGeometry args={[shape, 10]} />
        <meshStandardMaterial color="#ff4d6d" emissive="#ff2d55" emissiveIntensity={1.4} side={DoubleSide} />
      </instancedMesh>
      <group ref={label} position={[0, 1.05, 0]}>
        <Billboard>
          <Text font={FONT_URL} fontSize={0.26} color="#e5383b" outlineWidth={0.03} outlineColor="#fff5f5" anchorX="center">
            auau!
          </Text>
        </Billboard>
      </group>
    </>
  )
}
