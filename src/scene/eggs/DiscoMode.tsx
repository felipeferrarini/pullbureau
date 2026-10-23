'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, DoubleSide, type Group, type InstancedMesh, Object3D } from 'three'
import { DISCO_COLORS, sparkleSpots } from '@/eggs/disco'
import { isDiscoOn, useEggStore } from '@/eggs/eggStore'
import { WALL_HEIGHT } from '../layout'
import { useReducedMotion } from '../render/useReducedMotion'

const CENTER: [number, number, number] = [0, 0, -2.4]
const BALL_Y = 4.4
const DROP_S = 1.6
const SPARKLES = 220
const FLOOR_RADIUS = 13
const FLOOR_SQUASH = 0.45
const BEAMS = 6
const POOLS = 5

function MirrorBall({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null)
  const born = useRef<number | null>(null)
  useFrame(({ clock }) => {
    const ball = group.current
    if (!ball) return
    born.current ??= clock.elapsedTime
    const k = Math.min(1, (clock.elapsedTime - born.current) / DROP_S)
    const eased = 1 - (1 - k) ** 3
    ball.position.y = WALL_HEIGHT + 0.6 - (WALL_HEIGHT + 0.6 - BALL_Y) * eased
    ball.rotation.y = reduced ? 0 : clock.elapsedTime * 0.8
  })
  return (
    <group ref={group} position={[0, WALL_HEIGHT + 0.6, 0]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3, 6]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh castShadow>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial color="#f4f6fa" metalness={1} roughness={0.06} flatShading envMapIntensity={7} emissive="#8fa3d9" emissiveIntensity={0.3} />
      </mesh>
      <Beams reduced={reduced} />
    </group>
  )
}

function Beams({ reduced }: { reduced: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => ref.current?.rotation.set(0, reduced ? 0 : -clock.elapsedTime * 0.6, 0))
  return (
    <group ref={ref}>
      {Array.from({ length: BEAMS }, (_, i) => {
        const angle = (i / BEAMS) * Math.PI * 2
        return (
          <group key={i} rotation={[0, angle, 0.75]}>
            <mesh position={[0, -3.3, 0]}>
              <coneGeometry args={[0.75, 6.4, 18, 1, true]} />
              <meshBasicMaterial color={DISCO_COLORS[i % DISCO_COLORS.length]} transparent opacity={0.1} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function Sparkles({ reduced }: { reduced: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const spots = useMemo(() => sparkleSpots(SPARKLES, FLOOR_RADIUS), [])
  useLayoutEffect(() => {
    const instances = mesh.current
    if (!instances) return
    spots.forEach((_, i) => instances.setColorAt(i, new Color(DISCO_COLORS[i % DISCO_COLORS.length]).multiplyScalar(2.2)))
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true
  }, [spots])
  useFrame(({ clock }) => {
    const instances = mesh.current
    if (!instances) return
    const spin = reduced ? 0 : clock.elapsedTime * 0.5
    spots.forEach(([x, z, phase], i) => {
      const c = Math.cos(spin)
      const s = Math.sin(spin)
      const twinkle = reduced ? 1 : 0.6 + 0.4 * Math.sin(clock.elapsedTime * 6 + phase * 40)
      dummy.position.set((x * c - z * s) * 1.25, 0.03, (x * s + z * c) * FLOOR_SQUASH)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.scale.setScalar(0.14 * twinkle)
      dummy.updateMatrix()
      instances.setMatrixAt(i, dummy.matrix)
    })
    instances.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SPARKLES]} frustumCulled={false}>
      <circleGeometry args={[1, 8]} />
      <meshBasicMaterial transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

function Pools({ reduced }: { reduced: boolean }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    ref.current?.children.forEach((pool, i) => {
      const t = reduced ? i : clock.elapsedTime * 0.7 + i * 1.7
      pool.position.set(Math.sin(t * 0.9 + i) * 9, 0.025, Math.cos(t * 0.7 + i * 2) * 3)
    })
  })
  return (
    <group ref={ref}>
      {Array.from({ length: POOLS }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.8, 32]} />
          <meshBasicMaterial color={DISCO_COLORS[(i + 2) % DISCO_COLORS.length]} transparent opacity={0.28} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// Konami mode: the mirror ball comes down, the lights dim (Lighting) and everyone dances (ActorsLayer).
export function DiscoMode() {
  const on = useEggStore(isDiscoOn)
  const reduced = useReducedMotion()
  if (!on) return null
  return (
    <group position={CENTER}>
      <MirrorBall reduced={reduced} />
      <Sparkles reduced={reduced} />
      <Pools reduced={reduced} />
    </group>
  )
}
