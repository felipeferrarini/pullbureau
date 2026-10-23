'use client'

import { useMemo } from 'react'
import type { Rail } from '@/types/scene'
import { stanchionRails } from './layout'
import { palette } from './palette'

const POST_GAP = 1.8
const RIBBON_Y = 0.85

const key = (x: number, z: number) => `${x.toFixed(2)}:${z.toFixed(2)}`

function railPosts(rails: Rail[]): [number, number][] {
  const posts = new Map<string, [number, number]>()
  for (const { from, to } of rails) {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1])
    const steps = Math.max(1, Math.ceil(length / POST_GAP))
    for (let i = 0; i <= steps; i++) {
      const x = from[0] + ((to[0] - from[0]) * i) / steps
      const z = from[1] + ((to[1] - from[1]) * i) / steps
      posts.set(key(x, z), [x, z])
    }
  }
  return [...posts.values()]
}

function Post({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
        <meshStandardMaterial color={palette.post} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
        <meshStandardMaterial color={palette.post} />
      </mesh>
    </group>
  )
}

function Ribbon({ rail, color }: { rail: Rail; color: string }) {
  const [x1, z1] = rail.from
  const [x2, z2] = rail.to
  const length = Math.hypot(x2 - x1, z2 - z1)
  return (
    <mesh position={[(x1 + x2) / 2, RIBBON_Y, (z1 + z2) / 2]} rotation-y={Math.atan2(x2 - x1, z2 - z1)}>
      <boxGeometry args={[0.03, 0.08, length]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

export function RopeFence({ rails, color = palette.ribbon }: { rails: Rail[]; color?: string }) {
  const posts = useMemo(() => railPosts(rails), [rails])
  return (
    <group>
      {rails.map(rail => (
        <Ribbon key={key(...rail.from) + key(...rail.to)} rail={rail} color={color} />
      ))}
      {posts.map(([x, z]) => (
        <Post key={key(x, z)} x={x} z={z} />
      ))}
    </group>
  )
}

export function Stanchions({ index, count, length }: { index: number; count: number; length: number }) {
  const rails = useMemo(() => stanchionRails(index, count, length), [index, count, length])
  return <RopeFence rails={rails} />
}
