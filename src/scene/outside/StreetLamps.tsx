'use client'

import { useMemo } from 'react'
import { AdditiveBlending, CanvasTexture } from 'three'
import { useSkyLook } from '../render/SkyContext'
import { LAMP_Z, SIDEWALK_Y, lampXs } from './street'

const HEIGHT = 6.4
const ARM = 1.5
const LIT_NEAR = 22
const POLE = '#4c5257'

function usePoolTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
      gradient.addColorStop(0, 'rgba(255,214,150,0.85)')
      gradient.addColorStop(0.5, 'rgba(255,190,120,0.3)')
      gradient.addColorStop(1, 'rgba(255,180,110,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 128, 128)
    }
    return new CanvasTexture(canvas)
  }, [])
}

function Lamp({ x, on, pool }: { x: number; on: boolean; pool: CanvasTexture }) {
  const near = Math.abs(x) < LIT_NEAR
  return (
    <group position={[x, SIDEWALK_Y, LAMP_Z]}>
      <mesh position={[0, HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.11, HEIGHT, 10]} />
        <meshStandardMaterial color={POLE} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, HEIGHT - 0.05, ARM / 2]} rotation-x={Math.PI / 2 - 0.12} castShadow>
        <cylinderGeometry args={[0.045, 0.045, ARM, 8]} />
        <meshStandardMaterial color={POLE} metalness={0.5} roughness={0.5} />
      </mesh>
      <group position={[0, HEIGHT + 0.02, ARM]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.14, 0.62]} />
          <meshStandardMaterial color="#3a3f44" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.08, 0]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[0.3, 0.55]} />
          <meshStandardMaterial color="#fff0cf" emissive="#ffcf86" emissiveIntensity={on ? 6 : 0} side={2} />
        </mesh>
        {on && near && <pointLight position={[0, -0.4, 0]} color="#ffc983" intensity={22} distance={13} decay={1.5} />}
      </group>
      {on && (
        <mesh position={[0, 0.012, ARM - 0.4]} rotation-x={-Math.PI / 2} renderOrder={1}>
          <planeGeometry args={[7, 7]} />
          <meshBasicMaterial map={pool} transparent depthWrite={false} blending={AdditiveBlending} opacity={near ? 0.35 : 0.6} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

export function StreetLamps() {
  const on = useSkyLook().lampsOn
  const pool = usePoolTexture()
  return (
    <group>
      {lampXs().map(x => (
        <Lamp key={x} x={x} on={on} pool={pool} />
      ))}
    </group>
  )
}
