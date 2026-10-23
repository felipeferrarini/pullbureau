'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { AdditiveBlending, CanvasTexture, Color, DoubleSide, type Group, type MeshBasicMaterial, Object3D, SRGBColorSpace } from 'three'
import { CounterBooth } from '@/scene/CounterBooth'
import { GraniliteFloor } from '@/scene/hall/Floor'
import { Wall } from '@/scene/hall/Walls'
import { Post, Rope } from '@/scene/hallOfFame/pieces'
import { COUNTER_Z } from '@/scene/layout'
import { SkyProvider } from '@/scene/render/SkyContext'
import { useReducedMotion } from '@/scene/render/useReducedMotion'
import type { Counter } from '@/types/domain'
import type { Vec3 } from '@/types/scene'

export const BOOTH_Z = -3.3
const WALL_Z = -5.4
// The arena camera sits low: hang the repo sign just above the glass so the hud never covers them.
const SIGN_DROP = 1.2
const RING = { x: 2.75, back: -1.5, front: 1.7 }
const TUBE_GLOW = new Color('#e8f4ff').multiplyScalar(2.4)
const SMOKE: { position: Vec3; size: number; speed: number }[] = Array.from({ length: 16 }, (_, i) => ({
  position: [((i * 37) % 13) - 6.5, 0.35 + ((i * 17) % 7) * 0.16, -3.6 + ((i * 29) % 11) * 0.5],
  size: 2.4 + ((i * 13) % 5) * 0.6,
  speed: 0.04 + ((i * 7) % 5) * 0.015,
}))

function useSoftTexture(inner: string, outer: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      gradient.addColorStop(0, inner)
      gradient.addColorStop(1, outer)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 128, 128)
    }
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [inner, outer])
}

function useBeamTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 4
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 128)
      gradient.addColorStop(0, 'rgba(255,240,210,0.9)')
      gradient.addColorStop(1, 'rgba(255,240,210,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 4, 128)
    }
    return new CanvasTexture(canvas)
  }, [])
}

function Smoke() {
  const texture = useSoftTexture('rgba(200,185,170,0.55)', 'rgba(200,185,170,0)')
  const group = useRef<Group>(null)
  const still = useReducedMotion()
  useFrame(({ clock }) => {
    if (still || !group.current) return
    group.current.children.forEach((puff, i) => {
      const cloud = SMOKE[i]
      puff.position.set(cloud.position[0] + Math.sin(clock.elapsedTime * cloud.speed * 3 + i) * 0.8, cloud.position[1], cloud.position[2])
      puff.rotation.set(0, 0, clock.elapsedTime * cloud.speed * (i % 2 ? 1 : -1))
    })
  })
  return (
    <group ref={group}>
      {SMOKE.map(cloud => (
        <mesh key={cloud.position.join()} position={cloud.position}>
          <planeGeometry args={[cloud.size, cloud.size]} />
          <meshBasicMaterial map={texture} transparent opacity={0.22} depthWrite={false} color="#a89888" />
        </mesh>
      ))}
    </group>
  )
}

function LightCone({ position, color, opacity }: { position: Vec3; color: string; opacity: number }) {
  const texture = useBeamTexture()
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.25, 2.3, 5.6, 32, 1, true]} />
      <meshBasicMaterial map={texture} color={color} transparent opacity={opacity} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
    </mesh>
  )
}

function Tube({ position, flicker }: { position: Vec3; flicker: boolean }) {
  const material = useRef<MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    if (!material.current || !flicker) return
    const t = clock.elapsedTime
    const off = Math.sin(t * 23) > 0.92 || (t % 5 > 4.7 && Math.sin(t * 60) > 0)
    material.current.color.copy(TUBE_GLOW).multiplyScalar(off ? 0.15 : 1)
  })
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.8, 0.07, 0.24]} />
        <meshStandardMaterial color="#d0d4d8" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.045, 0]}>
        <boxGeometry args={[1.7, 0.03, 0.12]} />
        <meshBasicMaterial ref={material} color={TUBE_GLOW} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Spot({ position, target, color, intensity, shadow = false, angle = 0.5 }: { position: Vec3; target: Vec3; color: string; intensity: number; shadow?: boolean; angle?: number }) {
  const [aim] = useState(() => new Object3D())
  return (
    <>
      <primitive object={aim} position={target} />
      <spotLight position={position} target={aim} color={color} intensity={intensity} angle={angle} penumbra={0.6} distance={22} decay={1.6} castShadow={shadow} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
    </>
  )
}

function Lights() {
  const still = useReducedMotion()
  return (
    <>
      <ambientLight intensity={0.16} color="#ffd9b8" />
      <hemisphereLight args={['#34405a', '#1a0f08', 0.5]} />
      <Spot position={[0, 7, 3.2]} target={[0, 0.8, 0]} color="#ffe2bd" intensity={160} shadow angle={0.42} />
      <Spot position={[-6, 4.2, -2.6]} target={[-1, 1.2, 0]} color="#ff4a1c" intensity={120} />
      <Spot position={[6, 4.2, -2.6]} target={[1, 1.2, 0]} color="#2f7bff" intensity={120} />
      <Spot position={[0, 3.5, 7]} target={[0, 1.2, 0]} color="#ffc9a0" intensity={22} angle={0.7} />
      <LightCone position={[0, 4.2, 0.4]} color="#ffe2bd" opacity={0.09} />
      <Tube position={[-2.4, 4.6, -1]} flicker={false} />
      <Tube position={[2.4, 4.6, -1]} flicker={!still} />
    </>
  )
}

function Ring() {
  const posts: Vec3[] = [
    [-RING.x, 0, RING.back],
    [RING.x, 0, RING.back],
    [-RING.x, 0, RING.front],
    [RING.x, 0, RING.front],
  ]
  return (
    <>
      {posts.map(post => (
        <Post key={post.join()} position={post} />
      ))}
      <Rope from={[-RING.x, 0.9, RING.back]} to={[RING.x, 0.9, RING.back]} />
      <Rope from={[-RING.x, 0.9, RING.back]} to={[-RING.x, 0.9, RING.front]} />
      <Rope from={[RING.x, 0.9, RING.back]} to={[RING.x, 0.9, RING.front]} />
    </>
  )
}

export function ArenaSet({ counter, low }: { counter: Counter | null; low: boolean }) {
  return (
    <SkyProvider>
      <color attach="background" args={['#0d0807']} />
      <fog attach="fog" args={['#120a08', 9, 26]} />
      <GraniliteFloor width={22} depth={16} centerZ={-1} />
      <Wall length={22} position={[0, 0, WALL_Z]} rotation={0} windows={[]} />
      {counter && (
        <group position={[0, 0, BOOTH_Z - COUNTER_Z]}>
          <CounterBooth counter={counter} index={0} count={1} last signDrop={SIGN_DROP} repoSignOnly />
        </group>
      )}
      <Ring />
      <Lights />
      {!low && <Smoke />}
    </SkyProvider>
  )
}
