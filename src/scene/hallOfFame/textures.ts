'use client'

import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Shape } from 'three'

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function canvas(size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void): HTMLCanvasElement {
  const element = document.createElement('canvas')
  element.width = element.height = size
  const ctx = element.getContext('2d')
  if (ctx) paint(ctx, size)
  return element
}

function paintCork(ctx: CanvasRenderingContext2D, size: number) {
  const random = seeded(31)
  ctx.fillStyle = '#b8875a'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 7000; i++) {
    const tone = random()
    ctx.fillStyle = tone < 0.45 ? '#8a5d36' : tone < 0.8 ? '#d3a679' : '#6e4627'
    ctx.globalAlpha = 0.35 + random() * 0.5
    ctx.beginPath()
    ctx.ellipse(random() * size, random() * size, 0.6 + random() * 2.6, 0.5 + random() * 1.8, random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function paintGloss(ctx: CanvasRenderingContext2D, size: number) {
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.28, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.34, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.08)')
  gradient.addColorStop(0.47, 'rgba(255,255,255,0.3)')
  gradient.addColorStop(0.52, 'rgba(255,255,255,0)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
}

function texture(element: HTMLCanvasElement, repeat: [number, number] = [1, 1]) {
  const result = new CanvasTexture(element)
  result.colorSpace = SRGBColorSpace
  result.wrapS = result.wrapT = RepeatWrapping
  result.repeat.set(...repeat)
  result.anisotropy = 8
  return result
}

export function useCorkTexture(width: number, height: number) {
  return useMemo(() => texture(canvas(512, paintCork), [width / 2.5, height / 2.5]), [width, height])
}

export const useGlossTexture = () => useMemo(() => texture(canvas(256, paintGloss)), [])

export function starShape(points = 4, outer = 1, inner = 0.28): Shape {
  const shape = new Shape()
  for (let i = 0; i <= points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  return shape
}
