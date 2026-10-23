'use client'

import { t } from '@/i18n'


import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Vec3 } from '@/types/scene'

const WIDTH = 0.92
const HEIGHT = 0.66
const POLE = 1.25
const BLUE = '#1f57a8'
const FONT = '"Arial Black", "Helvetica Neue", Arial, sans-serif'
const PX = 512

type Draw = (ctx: CanvasRenderingContext2D, s: number) => void

const line = (ctx: CanvasRenderingContext2D, points: [number, number][], s: number) => {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)))
  ctx.stroke()
}

const head = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, s: number) => {
  ctx.beginPath()
  ctx.arc(x * s, y * s, r * s, 0, Math.PI * 2)
  ctx.fill()
}

const elder: Draw = (ctx, s) => {
  head(ctx, 0.42, 0.16, 0.09, s)
  line(ctx, [[0.44, 0.3], [0.5, 0.62]], s)
  line(ctx, [[0.5, 0.62], [0.4, 0.94]], s)
  line(ctx, [[0.5, 0.62], [0.6, 0.94]], s)
  line(ctx, [[0.46, 0.4], [0.7, 0.52]], s)
  line(ctx, [[0.66, 0.5], [0.72, 0.48], [0.74, 0.95]], s)
}

const pregnant: Draw = (ctx, s) => {
  head(ctx, 0.46, 0.15, 0.09, s)
  line(ctx, [[0.46, 0.29], [0.46, 0.66]], s)
  ctx.beginPath()
  ctx.arc(0.5 * s, 0.5 * s, 0.13 * s, -Math.PI / 2, Math.PI / 2)
  ctx.stroke()
  line(ctx, [[0.46, 0.66], [0.4, 0.94]], s)
  line(ctx, [[0.48, 0.66], [0.56, 0.94]], s)
  line(ctx, [[0.46, 0.36], [0.34, 0.56]], s)
}

const wheelchair: Draw = (ctx, s) => {
  head(ctx, 0.4, 0.14, 0.09, s)
  line(ctx, [[0.4, 0.28], [0.4, 0.58], [0.66, 0.58], [0.72, 0.86]], s)
  line(ctx, [[0.4, 0.4], [0.6, 0.4]], s)
  ctx.beginPath()
  ctx.arc(0.4 * s, 0.72 * s, 0.21 * s, -0.3, Math.PI * 1.6)
  ctx.stroke()
}

const lapBaby: Draw = (ctx, s) => {
  head(ctx, 0.38, 0.15, 0.09, s)
  line(ctx, [[0.38, 0.29], [0.38, 0.66]], s)
  line(ctx, [[0.38, 0.66], [0.32, 0.94]], s)
  line(ctx, [[0.38, 0.66], [0.46, 0.94]], s)
  line(ctx, [[0.38, 0.4], [0.58, 0.52]], s)
  head(ctx, 0.66, 0.36, 0.065, s)
  ctx.beginPath()
  ctx.ellipse(0.62 * s, 0.5 * s, 0.1 * s, 0.06 * s, -0.5, 0, Math.PI * 2)
  ctx.fill()
}

const ICONS = [elder, pregnant, wheelchair, lapBaby]

function paint(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = BLUE
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = width * 0.018
  ctx.strokeRect(width * 0.03, height * 0.04, width * 0.94, height * 0.92)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `900 ${Math.round(height * 0.13)}px ${FONT}`
  ctx.fillText(t('ui.service'), width / 2, height * 0.18)
  ctx.fillText(t('ui.priority'), width / 2, height * 0.33)
  const size = width * 0.19
  const gap = (width * 0.86 - size * ICONS.length) / (ICONS.length - 1)
  ICONS.forEach((icon, i) => {
    ctx.save()
    ctx.translate(width * 0.07 + i * (size + gap), height * 0.45)
    ctx.lineWidth = size * 0.09
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    icon(ctx, size)
    ctx.restore()
  })
}

function signTexture(): CanvasTexture {
  const element = document.createElement('canvas')
  element.width = PX
  element.height = Math.round((PX * HEIGHT) / WIDTH)
  const ctx = element.getContext('2d', { willReadFrequently: true })
  if (ctx) paint(ctx, element.width, element.height)
  const texture = new CanvasTexture(element)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// A pedestal sign at the mouth of the (always empty) priority lane.
export function PrioritySign({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const texture = useMemo(() => signTexture(), [])
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.025, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.05, 20]} />
        <meshStandardMaterial color="#3a3f44" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, POLE / 2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, POLE, 10]} />
        <meshStandardMaterial color="#9aa1a8" metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0, POLE + HEIGHT / 2 - 0.05, 0]} rotation-x={-0.12}>
        <mesh castShadow>
          <boxGeometry args={[WIDTH + 0.04, HEIGHT + 0.04, 0.025]} />
          <meshStandardMaterial color="#d9dde1" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.014]}>
          <planeGeometry args={[WIDTH, HEIGHT]} />
          <meshStandardMaterial map={texture} roughness={0.55} />
        </mesh>
      </group>
    </group>
  )
}
