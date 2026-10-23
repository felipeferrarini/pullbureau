'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Mesh } from 'three'
import { FACADE_Z } from '../layout'
import { Cutaway } from './Cutaway'
import { SIDEWALK_Y } from './street'
import { toTexture } from './textures'
import { currentGust } from './wind'

const POLE_HEIGHT = 7.2
const FLAG = { width: 1.5, height: 1.05 }
const SEGMENTS = 14

function paintBrazil(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 210
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#009c3b'
  ctx.fillRect(0, 0, 300, 210)
  ctx.fillStyle = '#ffdf00'
  ctx.beginPath()
  ctx.moveTo(150, 18)
  ctx.lineTo(282, 105)
  ctx.lineTo(150, 192)
  ctx.lineTo(18, 105)
  ctx.fill()
  ctx.fillStyle = '#002776'
  ctx.beginPath()
  ctx.arc(150, 105, 52, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.arc(150, 200, 110, Math.PI * 1.32, Math.PI * 1.68)
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 18; i++) ctx.fillRect(110 + ((i * 37) % 80), 115 + ((i * 23) % 34), 3, 3)
  return canvas
}

// One arm of the Cruz de Brasília: an arrow pointing out from the centre, drawn pointing up.
function arrowArm(ctx: CanvasRenderingContext2D, length: number) {
  ctx.beginPath()
  ctx.moveTo(0, -length)
  ctx.lineTo(19, -length + 32)
  ctx.lineTo(8, -length + 28)
  ctx.lineTo(10, -12)
  ctx.lineTo(0, -5)
  ctx.lineTo(-10, -12)
  ctx.lineTo(-8, -length + 28)
  ctx.lineTo(-19, -length + 32)
  ctx.closePath()
  ctx.fill()
}

// Distrito Federal: white field, a green band across the middle and the yellow cross of four arrows.
function paintDistritoFederal(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 210
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 300, 210)
  ctx.fillStyle = '#00843d'
  ctx.fillRect(0, 70, 300, 70)
  ctx.fillStyle = '#ffcc29'
  ctx.translate(150, 105)
  for (const [turn, length] of [[0, 84], [Math.PI / 2, 66], [Math.PI, 84], [-Math.PI / 2, 66]]) {
    ctx.save()
    ctx.rotate(turn)
    arrowArm(ctx, length)
    ctx.restore()
  }
  return canvas
}

function Flag({ paint, phase }: { paint: () => HTMLCanvasElement; phase: number }) {
  const mesh = useRef<Mesh>(null)
  const map = useMemo(() => toTexture(paint()), [paint])
  useFrame(({ clock }) => {
    const geometry = mesh.current?.geometry
    if (!geometry) return
    const positions = geometry.attributes.position
    const gust = currentGust()
    const t = clock.elapsedTime * (2.4 + gust * 4) + phase
    const swing = 1 + gust * 2.2
    for (let i = 0; i < positions.count; i++) {
      const u = positions.getX(i) / FLAG.width + 0.5
      positions.setZ(i, (Math.sin(u * 5 - t) * 0.12 * u + Math.sin(u * 9 - t * 1.7) * 0.03 * u) * swing)
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  })
  return (
    <mesh ref={mesh} position={[FLAG.width / 2 + 0.04, POLE_HEIGHT - FLAG.height / 2 - 0.2, 0]} castShadow>
      <planeGeometry args={[FLAG.width, FLAG.height, SEGMENTS, 4]} />
      <meshStandardMaterial map={map} side={2} roughness={0.8} />
    </mesh>
  )
}

function Pole({ x, paint, phase }: { x: number; paint: () => HTMLCanvasElement; phase: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, POLE_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, POLE_HEIGHT, 10]} />
        <meshStandardMaterial color="#d9dde0" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, POLE_HEIGHT + 0.05, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#e0b850" metalness={0.8} roughness={0.3} />
      </mesh>
      <Flag paint={paint} phase={phase} />
    </group>
  )
}

export function Flagpoles() {
  return (
    <group position={[0, SIDEWALK_Y, FACADE_Z + 1.1]}>
      <mesh position={[-6.7, 0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[3, 0.3, 0.9]} />
        <meshStandardMaterial color="#c9c3b6" roughness={0.8} />
      </mesh>
      <Cutaway position={[0, 0.3, 0]}>
        <Pole x={-7.7} paint={paintBrazil} phase={0} />
        <Pole x={-6.2} paint={paintDistritoFederal} phase={1.3} />
      </Cutaway>
    </group>
  )
}
