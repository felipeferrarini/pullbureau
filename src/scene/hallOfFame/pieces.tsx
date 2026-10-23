'use client'

import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { AdditiveBlending, CatmullRomCurve3, Color, type Group, type MeshBasicMaterial, SRGBColorSpace, Vector3 } from 'three'
import type { Vec3 } from '@/types/scene'
import { avatarTextureUrl } from '../Badge'
import { useReducedMotion } from '../render/useReducedMotion'
import { SafeBoundary } from '../SafeBoundary'
import { starShape } from './textures'

export const GOLD = '#d9a62e'
export const MEDAL: Record<1 | 2 | 3, string> = { 1: '#e2b13c', 2: '#c3ccd6', 3: '#c27a45' }

export function GoldMaterial({ color = GOLD, roughness = 0.24 }: { color?: string; roughness?: number }) {
  return <meshStandardMaterial color={color} metalness={1} roughness={roughness} envMapIntensity={1.4} />
}

type FrameProps = { width: number; height: number; border: number; color?: string; depth?: number; ornate?: boolean }

// A moulded frame: flat rail, rounded bead, inner lip and corner rosettes.
export function GildedFrame({ width, height, border, color = GOLD, depth = 0.14, ornate = true }: FrameProps) {
  const rails = useMemo(() => {
    const w = width / 2 - border / 2
    const h = height / 2 - border / 2
    return [
      { position: [0, h, 0] as Vec3, length: width, vertical: false },
      { position: [0, -h, 0] as Vec3, length: width, vertical: false },
      { position: [-w, 0, 0] as Vec3, length: height - border * 2, vertical: true },
      { position: [w, 0, 0] as Vec3, length: height - border * 2, vertical: true },
    ]
  }, [width, height, border])
  const corners: Vec3[] = [
    [-width / 2 + border / 2, height / 2 - border / 2, depth * 0.9],
    [width / 2 - border / 2, height / 2 - border / 2, depth * 0.9],
    [-width / 2 + border / 2, -height / 2 + border / 2, depth * 0.9],
    [width / 2 - border / 2, -height / 2 + border / 2, depth * 0.9],
  ]
  return (
    <group>
      {rails.map(rail => (
        <group key={`${rail.position.join()}`} position={rail.position} rotation-z={rail.vertical ? Math.PI / 2 : 0}>
          <mesh position={[0, 0, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[rail.length, border, depth]} />
            <GoldMaterial color={color} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, depth]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[border * 0.22, border * 0.22, rail.length - border * 0.6, 14, 1, false, 0, Math.PI]} />
            <GoldMaterial color={color} />
          </mesh>
          <mesh position={[0, (rail.vertical ? 1 : -1) * 0, depth * 0.55]}>
            <boxGeometry args={[rail.length - border * 1.4, border * 0.12, depth * 0.3]} />
            <GoldMaterial color={color} roughness={0.18} />
          </mesh>
        </group>
      ))}
      {ornate &&
        corners.map(corner => (
          <mesh key={corner.join()} position={corner} scale={[1, 1, 0.55]}>
            <sphereGeometry args={[border * 0.42, 16, 12]} />
            <GoldMaterial color={color} roughness={0.2} />
          </mesh>
        ))}
    </group>
  )
}

function Photo({ login, size }: { login: string; size: number }) {
  const texture = useTexture(avatarTextureUrl(login, 256), loaded => {
    const single = Array.isArray(loaded) ? loaded[0] : loaded
    single.colorSpace = SRGBColorSpace
  })
  return (
    <mesh>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export function AvatarPhoto({ login, size, fallback = '#3d4a43' }: { login: string; size: number; fallback?: string }) {
  const blank = (
    <mesh>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={fallback} />
    </mesh>
  )
  return (
    <SafeBoundary fallback={blank}>
      <Suspense fallback={blank}>
        <Photo login={login} size={size} />
      </Suspense>
    </SafeBoundary>
  )
}

const STAR_GLOW = new Color('#fff1c1')
const STAR_PERIOD = 2.6

export type Twinkle = { position: Vec3; size: number; phase: number }

function Star({ star, still }: { star: Twinkle; still: boolean }) {
  const group = useRef<Group>(null)
  const material = useRef<MeshBasicMaterial>(null)
  const shape = useMemo(() => starShape(), [])
  useFrame(({ clock }) => {
    if (!group.current || !material.current) return
    const wave = still ? 0.6 : Math.max(0, Math.sin(((clock.elapsedTime + star.phase) / STAR_PERIOD) * Math.PI * 2))
    const pulse = wave ** 3
    group.current.scale.setScalar(star.size * (0.35 + 0.65 * pulse))
    group.current.rotation.set(0, 0, star.phase + (still ? 0 : clock.elapsedTime * 0.4))
    material.current.color.copy(STAR_GLOW).multiplyScalar(0.6 + pulse * 5)
  })
  return (
    <group ref={group} position={star.position}>
      <mesh>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial ref={material} toneMapped={false} transparent blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function Twinkles({ stars }: { stars: Twinkle[] }) {
  const still = useReducedMotion()
  return (
    <>
      {stars.map(star => (
        <Star key={star.position.join()} star={star} still={still} />
      ))}
    </>
  )
}

export function Rope({ from, to }: { from: Vec3; to: Vec3 }) {
  const curve = useMemo(() => {
    const mid = new Vector3((from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 0.22, (from[2] + to[2]) / 2)
    return new CatmullRomCurve3([new Vector3(...from), mid, new Vector3(...to)])
  }, [from, to])
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 24, 0.03, 8, false]} />
      <meshStandardMaterial color="#9b111e" roughness={0.6} />
    </mesh>
  )
}

export function Post({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.06, 20]} />
        <meshStandardMaterial color="#c9a13d" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.9, 12]} />
        <meshStandardMaterial color="#c9a13d" metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.065, 14, 10]} />
        <meshStandardMaterial color="#c9a13d" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  )
}
