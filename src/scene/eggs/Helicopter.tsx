'use client'

import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, type Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial, type Points } from 'three'
import { useAppStore } from '@/client/store'
import { HELI_LANDING, ROTOR_RADIUS, doorOpen, heliPose, rotorKeys } from '@/eggs/helicopter'
import { playRotor } from '@/sound/sfx'
import type { HeliPose, HeliTiming } from '@/types/eggs'
import { FONT_URL } from '../fonts'
import { setGust } from '../outside/wind'
import { useLiteScene } from '../render/quality'
import { useReducedMotion } from '../render/useReducedMotion'

const BODY = '#f4f0e4'
const BELLY = '#1f4d3a'
const ACCENT = '#ffb020'
const METAL = '#3d4247'
const GLASS = '#203445'
const ROTOR_Y = 2.62
const FULL_SPIN = 42
const TAIL_SPIN = 70
const MAX_LAG_MS = 400
const SHAKE = 0.0035
const DUST = 110
const DUST_REDUCED = 36

function useDiscTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128)
      gradient.addColorStop(0, 'rgba(40,44,48,0)')
      gradient.addColorStop(0.25, 'rgba(40,44,48,0.42)')
      gradient.addColorStop(0.92, 'rgba(40,44,48,0.62)')
      gradient.addColorStop(1, 'rgba(40,44,48,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 256, 256)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 3
      for (const r of [70, 104, 122]) {
        ctx.beginPath()
        ctx.arc(128, 128, r, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    return new CanvasTexture(canvas)
  }, [])
}

function useSoftDot() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      gradient.addColorStop(0, 'rgba(255,255,255,1)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 64, 64)
    }
    return new CanvasTexture(canvas)
  }, [])
}

function Skids() {
  return (
    <group>
      {[-0.8, 0.8].map(x => (
        <group key={x} position={[x, 0.06, 0]}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.055, 0.055, 2.9, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.12, 1.55]} rotation-x={Math.PI / 2 - 0.9}>
            <cylinderGeometry args={[0.055, 0.055, 0.4, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
          </mesh>
          {[-0.75, 0.75].map(z => (
            <mesh key={z} position={[-x * 0.12, 0.27, z]} rotation-z={x > 0 ? 0.35 : -0.35}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
              <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Livery({ lite }: { lite: boolean }) {
  if (lite) return null
  return (
    <>
      {[1, -1].map(side => (
        <Text key={side} font={FONT_URL} position={[side * 0.86, 1.02, -0.25]} rotation-y={(side * Math.PI) / 2} fontSize={0.3} letterSpacing={0.06} color={BODY} anchorX="center" anchorY="middle">
          acme
        </Text>
      ))}
    </>
  )
}

function Cabin({ lite, door }: { lite: boolean; door: React.RefObject<Group | null> }) {
  return (
    <group>
      <mesh position={[0, 1.3, 0.1]} rotation-x={Math.PI / 2} scale={[0.95, 1, 1]} castShadow>
        <capsuleGeometry args={[0.84, 1.5, 6, 16]} />
        <meshStandardMaterial color={BODY} roughness={0.35} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.98, 0.1]} rotation-x={Math.PI / 2} scale={[0.965, 1.01, 0.62]}>
        <capsuleGeometry args={[0.84, 1.5, 6, 16]} />
        <meshStandardMaterial color={BELLY} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.5, 0.95]} scale={[0.86, 0.66, 0.78]}>
        <sphereGeometry args={[0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={GLASS} roughness={0.12} metalness={0.4} />
      </mesh>
      {[1, -1].map(side => (
        <mesh key={side} position={[side * 0.79, 1.62, 0.05]} rotation-y={(side * Math.PI) / 2}>
          <planeGeometry args={[0.9, 0.42]} />
          <meshStandardMaterial color={GLASS} roughness={0.12} metalness={0.4} side={DoubleSide} />
        </mesh>
      ))}
      <group ref={door} position={[0.81, 1.25, -0.15]}>
        <mesh>
          <boxGeometry args={[0.05, 0.95, 0.75]} />
          <meshStandardMaterial color={BODY} roughness={0.35} />
        </mesh>
      </group>
      <mesh position={[0, 2.12, -0.35]} castShadow>
        <boxGeometry args={[0.85, 0.42, 1.3]} />
        <meshStandardMaterial color={BODY} roughness={0.35} />
      </mesh>
      <mesh position={[0, 2.18, -1.05]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.16, 0.2, 0.3, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.62, 1.55]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.4} />
      </mesh>
      <Livery lite={lite} />
    </group>
  )
}

function Tail({ tailRotor }: { tailRotor: React.RefObject<Group | null> }) {
  return (
    <group>
      <mesh position={[0, 1.55, -2.45]} rotation-x={Math.PI / 2 + 0.06} castShadow>
        <cylinderGeometry args={[0.24, 0.11, 2.7, 10]} />
        <meshStandardMaterial color={BODY} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.42, -2.35]} rotation-x={Math.PI / 2 + 0.06} scale={[1.02, 1, 0.5]}>
        <cylinderGeometry args={[0.245, 0.115, 2.4, 10]} />
        <meshStandardMaterial color={BELLY} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.95, -3.75]} rotation-x={-0.35}>
        <boxGeometry args={[0.07, 0.85, 0.5]} />
        <meshStandardMaterial color={BELLY} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.5, -3.45]}>
        <boxGeometry args={[1.2, 0.05, 0.32]} />
        <meshStandardMaterial color={BODY} roughness={0.4} />
      </mesh>
      <group ref={tailRotor} position={[0.12, 1.98, -3.85]}>
        {[0, Math.PI / 2].map(angle => (
          <mesh key={angle} rotation-x={angle}>
            <boxGeometry args={[0.03, 0.95, 0.09]} />
            <meshStandardMaterial color={METAL} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function MainRotor({ blades, disc, discMaterial }: { blades: React.RefObject<Group | null>; disc: CanvasTexture; discMaterial: React.RefObject<MeshBasicMaterial | null> }) {
  return (
    <group position={[0, ROTOR_Y, -0.35]}>
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.3, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
      </mesh>
      <group ref={blades}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 10]} />
          <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.3} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map(angle => (
          <mesh key={angle} rotation-y={angle} position={[Math.sin(angle) * ROTOR_RADIUS * 0.5, 0, Math.cos(angle) * ROTOR_RADIUS * 0.5]} castShadow>
            <boxGeometry args={[0.2, 0.035, ROTOR_RADIUS]} />
            <meshStandardMaterial color="#2b2f33" roughness={0.5} transparent />
          </mesh>
        ))}
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} renderOrder={2}>
        <circleGeometry args={[ROTOR_RADIUS, 40]} />
        <meshBasicMaterial ref={discMaterial} map={disc} transparent depthWrite={false} side={DoubleSide} opacity={0} />
      </mesh>
    </group>
  )
}

function dustSeeds(count: number) {
  return Array.from({ length: count }, (_, i) => ({ angle: (i / count) * Math.PI * 2 + Math.sin(i * 7.3) * 0.4, phase: (i * 0.618) % 1, lift: 0.3 + ((i * 37) % 10) / 14 }))
}

function RotorWash({ pose, reduced }: { pose: React.RefObject<HeliPose | null>; reduced: boolean }) {
  const count = reduced ? DUST_REDUCED : DUST
  const dot = useSoftDot()
  const seeds = useMemo(() => dustSeeds(count), [count])
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
    return g
  }, [count])
  const points = useRef<Points>(null)
  useFrame(({ clock }) => {
    const current = pose.current
    const cloud = points.current
    if (!current || !cloud) return
    const material = cloud.material as MeshBasicMaterial
    material.opacity = current.wash * (reduced ? 0.4 : 0.75)
    const positions = cloud.geometry.attributes.position as BufferAttribute
    const t = clock.elapsedTime * (reduced ? 0.25 : 0.7)
    seeds.forEach((seed, i) => {
      const travel = (t + seed.phase) % 1
      const radius = 0.9 + travel * (ROTOR_RADIUS + 3.5)
      positions.setXYZ(i, current.position[0] + Math.sin(seed.angle) * radius, HELI_LANDING[1] + 0.08 + Math.sin(travel * Math.PI) * seed.lift, current.position[2] + Math.cos(seed.angle) * radius)
    })
    positions.needsUpdate = true
  })
  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial map={dot} size={0.55} sizeAttenuation color="#d9ccb0" transparent opacity={0} depthWrite={false} />
    </points>
  )
}

function GroundShadow({ pose }: { pose: React.RefObject<HeliPose | null> }) {
  const mesh = useRef<Mesh>(null)
  useFrame(() => {
    const current = pose.current
    if (!current || !mesh.current) return
    const height = current.position[1] - HELI_LANDING[1]
    mesh.current.position.set(current.position[0], HELI_LANDING[1] + 0.02, current.position[2])
    const material = mesh.current.material as MeshBasicMaterial
    material.opacity = Math.max(0, 0.32 * (1 - height / 16))
  })
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} renderOrder={1}>
      <circleGeometry args={[1.9, 24]} />
      <meshBasicMaterial color="#000000" transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function useRotorSound(timing: HeliTiming, elapsedRef: React.RefObject<number>) {
  const soundOn = useAppStore(state => state.soundOn)
  useEffect(() => {
    if (!soundOn) return
    return playRotor(rotorKeys(timing, elapsedRef.current ?? 0))
  }, [soundOn, timing, elapsedRef])
}

// The inspector's ride: flies in along the street, lands on the square in front of the door, waits and leaves.
export function Helicopter({ timing, elapsed }: { timing: HeliTiming; elapsed: number }) {
  const lite = useLiteScene()
  const reduced = useReducedMotion()
  const { camera, controls } = useThree()
  const disc = useDiscTexture()
  const root = useRef<Group>(null)
  const blades = useRef<Group>(null)
  const tailRotor = useRef<Group>(null)
  const door = useRef<Group>(null)
  const discMaterial = useRef<MeshBasicMaterial>(null)
  const pose = useRef<HeliPose | null>(null)
  const clock = useRef({ elapsed, real: 0 })
  const elapsedRef = useRef(elapsed)

  useEffect(() => {
    clock.current = { elapsed, real: performance.now() }
    elapsedRef.current = elapsed
  }, [elapsed])
  useEffect(() => () => setGust(0), [])
  useRotorSound(timing, elapsedRef)

  useFrame((_, delta) => {
    const group = root.current
    if (!group) return
    const t = clock.current.elapsed + Math.min(MAX_LAG_MS, performance.now() - (clock.current.real || performance.now()))
    const current = heliPose(t, timing)
    pose.current = current
    group.position.set(...current.position)
    group.rotation.set(current.pitch, current.yaw, current.roll, 'YXZ')
    blades.current?.rotateY(current.rotor * FULL_SPIN * delta)
    tailRotor.current?.rotateX(current.rotor * TAIL_SPIN * delta)
    door.current?.position.set(0.81 + doorOpen(t, timing) * 0.06, 1.25, -0.15 - doorOpen(t, timing) * 0.72)
    blades.current?.children.forEach(blade => {
      const material = (blade as Mesh).material as MeshStandardMaterial
      if (material.transparent) material.opacity = 1 - current.rotor * 0.72
    })
    if (discMaterial.current) discMaterial.current.opacity = current.rotor * 0.85
    setGust(current.wash)
    const orbit = controls as { enabled?: boolean } | null
    if (!reduced && current.wash > 0.2 && orbit?.enabled) {
      const amount = SHAKE * current.wash
      camera.rotateX((Math.random() - 0.5) * amount)
      camera.rotateY((Math.random() - 0.5) * amount)
    }
  })

  return (
    <group>
      <group ref={root} position={heliPose(elapsed, timing).position}>
        <Skids />
        <Cabin lite={lite} door={door} />
        <Tail tailRotor={tailRotor} />
        <MainRotor blades={blades} disc={disc} discMaterial={discMaterial} />
      </group>
      <GroundShadow pose={pose} />
      {!lite && <RotorWash pose={pose} reduced={reduced} />}
    </group>
  )
}
