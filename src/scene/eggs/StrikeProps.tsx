'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DoubleSide, type Group, type PlaneGeometry } from 'three'
import type { StrikeBanner, StrikeSign } from '@/types/eggs'
import { useReducedMotion } from '../render/useReducedMotion'
import { bannerTexture, signTexture } from './eggTextures'

const SIGN_W = 0.62
const SIGN_H = 0.42
const STICK = 0.62
const STANDING_Y = 2.28
const SEATED_Y = 1.78
const BOB = 0.07
const BOB_SPEED = 4.4

export function CardboardSign({ sign, seated }: { sign: StrikeSign; seated: boolean }) {
  const ref = useRef<Group>(null)
  const reduced = useReducedMotion()
  const texture = useMemo(() => signTexture(sign.slogan, sign.paint), [sign.slogan, sign.paint])
  const baseY = seated ? SEATED_Y : STANDING_Y

  useFrame(({ clock }) => {
    const group = ref.current
    if (!group?.parent) return
    const t = reduced ? 0 : clock.elapsedTime * BOB_SPEED + sign.phase
    group.position.y = baseY + Math.max(0, Math.sin(t)) * BOB
    group.rotation.set(0, -group.parent.rotation.y, sign.tilt + (reduced ? 0 : Math.sin(t * 0.5) * 0.05))
  })

  return (
    <group ref={ref} position={[0.12, baseY, 0]}>
      <mesh position={[0, -SIGN_H / 2 - STICK / 2 + 0.06, -0.02]}>
        <boxGeometry args={[0.035, STICK, 0.025]} />
        <meshStandardMaterial color="#9b7348" roughness={0.9} />
      </mesh>
      <mesh>
        <boxGeometry args={[SIGN_W, SIGN_H, 0.012]} />
        <meshStandardMaterial color={sign.paint.board} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 0.0065]}>
        <planeGeometry args={[SIGN_W, SIGN_H]} />
        <meshStandardMaterial map={texture} roughness={0.95} />
      </mesh>
    </group>
  )
}

const POLE_BOTTOM = 1.7
const POLE_TOP = 3.55
const CLOTH_H = 0.72
const CLOTH_TOP = 3.45
const SEGMENTS = 28
const FRONT = 0.42

function Pole({ x, z }: { x: number; z: number }) {
  const length = POLE_TOP - POLE_BOTTOM
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, POLE_BOTTOM + length / 2, 0]}>
        <cylinderGeometry args={[0.022, 0.022, length, 6]} />
        <meshStandardMaterial color="#8a6a43" roughness={0.85} />
      </mesh>
      {[1.95, 2.2].map(y => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.035, 0.012, 4, 10]} />
          <meshStandardMaterial color="#d9c8a0" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

export function StrikeBannerProp({ banner, text }: { banner: StrikeBanner; text: string }) {
  const geometry = useRef<PlaneGeometry>(null)
  const reduced = useReducedMotion()
  const texture = useMemo(() => bannerTexture(text), [text])
  const leftX = banner.left[0]
  const rightX = banner.right[0]
  const width = rightX - leftX
  const z = banner.left[2] + FRONT

  useFrame(({ clock }) => {
    const plane = geometry.current
    if (!plane) return
    const position = plane.attributes.position
    const t = reduced ? 0 : clock.elapsedTime
    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i) / width + 0.5
      const edge = Math.sin(Math.PI * u)
      const top = position.getY(i) > 0
      position.setY(i, (top ? CLOTH_H / 2 : -CLOTH_H / 2) - edge * (top ? 0.06 : 0.1))
      position.setZ(i, edge * (Math.sin(u * 9 + t * 1.8) * 0.035 + (top ? 0 : 0.05)))
    }
    position.needsUpdate = true
    plane.computeVertexNormals()
  })

  return (
    <group>
      <Pole x={leftX} z={z} />
      <Pole x={rightX} z={z} />
      <mesh position={[(leftX + rightX) / 2, CLOTH_TOP - CLOTH_H / 2, z + 0.02]}>
        <planeGeometry ref={geometry} args={[width - 0.04, CLOTH_H, SEGMENTS, 1]} />
        <meshStandardMaterial map={texture} roughness={0.95} side={DoubleSide} />
      </mesh>
    </group>
  )
}
