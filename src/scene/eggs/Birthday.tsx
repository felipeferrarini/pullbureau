'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CanvasTexture, type Group, type MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three'
import { useReducedMotion } from '../render/useReducedMotion'

const HAT_COLORS = ['#ff5d8f', '#ffd166']
const CANDLE_COLORS = ['#4cc9f0', '#f72585', '#80ed99', '#ffd166', '#b5179e']
const MAX_CANDLES = 6
const CAKE_OFFSET: [number, number, number] = [0.44, 0, 0.05]

let stripesTexture: CanvasTexture | null = null

function stripes(): CanvasTexture {
  if (stripesTexture) return stripesTexture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (ctx) {
    ctx.fillStyle = HAT_COLORS[0]
    ctx.fillRect(0, 0, 64, 64)
    ctx.fillStyle = HAT_COLORS[1]
    for (let i = -64; i < 128; i += 22) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 10, 0)
      ctx.lineTo(i + 74, 64)
      ctx.lineTo(i + 64, 64)
      ctx.fill()
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(3, 1)
  stripesTexture = texture
  return texture
}

// Sits on the head bone (unit scale), a little tilted.
export function PartyHat() {
  const texture = useMemo(() => stripes(), [])
  return (
    <group position={[0.05, 0.62, 0.02]} rotation={[0.15, 0, -0.28]}>
      <mesh position={[0, 0.17, 0]}>
        <coneGeometry args={[0.15, 0.36, 18, 1, true]} />
        <meshStandardMaterial map={texture} roughness={0.6} side={2} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.15, 0.018, 6, 20]} />
        <meshStandardMaterial color="#ffd166" roughness={0.5} />
      </mesh>
    </group>
  )
}

function Candle({ index, count, reduced }: { index: number; count: number; reduced: boolean }) {
  const flame = useRef<Group>(null)
  const glow = useRef<MeshStandardMaterial>(null)
  const angle = (index / count) * Math.PI * 2
  const radius = count === 1 ? 0 : 0.075
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 11 + index * 1.7
    const flicker = reduced ? 1 : 0.85 + Math.sin(t) * 0.1 + Math.sin(t * 2.3) * 0.06
    flame.current?.scale.set(1, flicker, 1)
    if (glow.current) glow.current.emissiveIntensity = 3.2 * flicker
  })
  return (
    <group position={[Math.cos(angle) * radius, 0.165, Math.sin(angle) * radius]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
        <meshStandardMaterial color={CANDLE_COLORS[index % CANDLE_COLORS.length]} roughness={0.5} />
      </mesh>
      <group ref={flame} position={[0, 0.09, 0]}>
        <mesh position={[0, 0.016, 0]}>
          <coneGeometry args={[0.013, 0.04, 8]} />
          <meshStandardMaterial ref={glow} color="#ffd36b" emissive="#ffb703" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

export function BirthdayCake({ months }: { months: number }) {
  const ref = useRef<Group>(null)
  const reduced = useReducedMotion()
  const candles = Math.min(MAX_CANDLES, Math.max(1, months))
  useFrame(() => {
    const group = ref.current
    if (group?.parent) group.rotation.set(0, -group.parent.rotation.y, 0)
  })
  return (
    <group ref={ref}>
      <group position={CAKE_OFFSET} scale={1.3}>
        <mesh position={[0, 0.008, 0]} receiveShadow>
          <cylinderGeometry args={[0.2, 0.19, 0.016, 20]} />
          <meshStandardMaterial color="#f8f9fa" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.12, 20]} />
          <meshStandardMaterial color="#e9b872" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.145, 0]}>
          <cylinderGeometry args={[0.158, 0.156, 0.035, 20]} />
          <meshStandardMaterial color="#ff8fab" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.125, 0]} rotation-x={Math.PI / 2} scale={[1, 1, 1.6]}>
          <torusGeometry args={[0.152, 0.016, 5, 20]} />
          <meshStandardMaterial color="#ff8fab" roughness={0.5} />
        </mesh>
        {Array.from({ length: candles }, (_, i) => (
          <Candle key={i} index={i} count={candles} reduced={reduced} />
        ))}
      </group>
    </group>
  )
}
