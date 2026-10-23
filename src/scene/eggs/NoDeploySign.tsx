'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import { useNoDeploy } from '@/eggs/eggClock'
import { BACK_WALL_Z } from '../layout'
import { BOARD_SPAN } from '../boardLayout'
import { useReducedMotion } from '../render/useReducedMotion'
import { noDeployTexture } from './eggTextures'

const WIDTH = 2.05
const HEIGHT = 0.8
const Y = 5.55
const GAP = 1.2
const LIT = 2.4

// A lightbox on the back wall, right of the board; it lights up on Fridays after 16h.
export function NoDeploySign() {
  const lit = useNoDeploy()
  const reduced = useReducedMotion()
  const face = useRef<MeshStandardMaterial>(null)
  const texture = useMemo(() => noDeployTexture(lit), [lit])
  useFrame(({ clock }) => {
    if (!face.current) return
    const buzz = lit && !reduced ? 0.92 + Math.sin(clock.elapsedTime * 31) * 0.04 + (Math.sin(clock.elapsedTime * 1.3) > 0.985 ? -0.5 : 0) : 1
    face.current.emissiveIntensity = lit ? LIT * buzz : 0
  })
  return (
    <group position={[BOARD_SPAN.maxX + GAP, Y, BACK_WALL_Z + 0.12]}>
      <mesh castShadow>
        <boxGeometry args={[WIDTH + 0.12, HEIGHT + 0.12, 0.12]} />
        <meshStandardMaterial color="#2b2f33" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[WIDTH, HEIGHT]} />
        <meshStandardMaterial ref={face} map={texture} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0} roughness={0.35} toneMapped={!lit} />
      </mesh>
    </group>
  )
}
