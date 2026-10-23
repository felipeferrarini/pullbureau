'use client'

import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

const TEXTURE_PX = 1024
const TILE_METERS = 4
const JOINTS = 2
const CHIPS = 9000
const CHIP_COLORS = ['#3b3631', '#5b534a', '#8c8072', '#f7f3ea', '#b46a4c', '#d9cdb8', '#2c2a27', '#a89b88']

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function paintGranilite(base: string, joint: string, seed: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = TEXTURE_PX
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const random = seeded(seed)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, TEXTURE_PX, TEXTURE_PX)
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${random() > 0.5 ? '255,250,240' : '120,105,90'},0.035)`
    ctx.beginPath()
    ctx.arc(random() * TEXTURE_PX, random() * TEXTURE_PX, 40 + random() * 160, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < CHIPS; i++) {
    const size = 0.8 + random() ** 3 * 5.5
    ctx.fillStyle = CHIP_COLORS[Math.floor(random() * CHIP_COLORS.length)]
    ctx.globalAlpha = 0.55 + random() * 0.45
    ctx.beginPath()
    const x = random() * TEXTURE_PX
    const y = random() * TEXTURE_PX
    const sides = 4 + Math.floor(random() * 3)
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + random()
      const radius = size * (0.6 + random() * 0.6)
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
    }
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = joint
  ctx.lineWidth = 3
  const step = TEXTURE_PX / JOINTS
  for (let i = 0; i <= JOINTS; i++) {
    ctx.beginPath()
    ctx.moveTo(i * step, 0)
    ctx.lineTo(i * step, TEXTURE_PX)
    ctx.moveTo(0, i * step)
    ctx.lineTo(TEXTURE_PX, i * step)
    ctx.stroke()
  }
  return canvas
}

export function useGraniliteTexture(width: number, depth: number, tone: 'clean' | 'dusty' = 'clean') {
  return useMemo(() => {
    const canvas = tone === 'clean' ? paintGranilite('#bdb09a', '#85776a', 7) : paintGranilite('#a9a092', '#6f665a', 11)
    const texture = new CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 8
    texture.repeat.set(width / TILE_METERS, depth / TILE_METERS)
    return texture
  }, [width, depth, tone])
}

type FloorProps = { centerX?: number; width: number; depth: number; centerZ: number; tone?: 'clean' | 'dusty' }

export function GraniliteFloor({ centerX = 0, width, depth, centerZ, tone = 'clean' }: FloorProps) {
  const texture = useGraniliteTexture(width, depth, tone)
  return (
    <mesh rotation-x={-Math.PI / 2} position={[centerX, 0, centerZ]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial map={texture} roughness={0.42} metalness={0} envMapIntensity={0.7} />
    </mesh>
  )
}
