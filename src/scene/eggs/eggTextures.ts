'use client'

import { CanvasTexture, SRGBColorSpace } from 'three'
import type { SignPaint } from '@/types/eggs'

const MARKER = '"Marker Felt", "Permanent Marker", "Chalkboard SE", "Comic Sans MS", "Arial Black", sans-serif'
const BRUSH = '"Arial Black", "Helvetica Neue", Impact, sans-serif'

const cache = new Map<string, CanvasTexture>()

function seeded(seed: number) {
  let state = seed || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function canvas(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  const ctx = element.getContext('2d', { willReadFrequently: true })
  if (ctx) paint(ctx)
  return element
}

function cached(key: string, build: () => HTMLCanvasElement): CanvasTexture {
  const hit = cache.get(key)
  if (hit) return hit
  const texture = new CanvasTexture(build())
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  cache.set(key, texture)
  return texture
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const word of text.split(' ')) {
    const last = lines.at(-1)
    if (last && ctx.measureText(`${last} ${word}`).width <= maxWidth) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines
}

function grain(ctx: CanvasRenderingContext2D, width: number, height: number, random: () => number, amount: number) {
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(60,35,10,0.1)'
    ctx.fillRect(random() * width, random() * height, 1 + random() * 3, 1 + random() * 2)
  }
}

// Letters drawn one by one with a little wobble, like a marker on cardboard.
function handLettering(ctx: CanvasRenderingContext2D, line: string, centerX: number, y: number, random: () => number) {
  const width = ctx.measureText(line).width
  let x = centerX - width / 2
  for (const char of line) {
    const advance = ctx.measureText(char).width
    ctx.save()
    ctx.translate(x + advance / 2, y + (random() - 0.5) * 6)
    ctx.rotate((random() - 0.5) * 0.12)
    ctx.fillText(char, 0, 0)
    ctx.restore()
    x += advance
  }
}

function paintSign(ctx: CanvasRenderingContext2D, slogan: string, paint: SignPaint, width: number, height: number) {
  const random = seeded(slogan.length * 97 + paint.board.charCodeAt(1))
  ctx.fillStyle = paint.board
  ctx.fillRect(0, 0, width, height)
  grain(ctx, width, height, random, 1800)
  ctx.strokeStyle = 'rgba(40,20,5,0.25)'
  ctx.lineWidth = 3
  for (let x = 14; x < width; x += 22) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + 2, height)
    ctx.globalAlpha = 0.12
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = paint.ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 112
  let lines: string[] = []
  do {
    ctx.font = `bold ${size}px ${MARKER}`
    lines = wrap(ctx, slogan, width * 0.86)
    size -= 6
  } while ((lines.length * size * 1.12 > height * 0.78 || lines.some(line => ctx.measureText(line).width > width * 0.9)) && size > 30)
  const lineHeight = size * 1.08
  lines.forEach((line, i) => handLettering(ctx, line, width / 2, height / 2 + (i - (lines.length - 1) / 2) * lineHeight, random))
  ctx.strokeStyle = 'rgba(30,15,5,0.35)'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, width - 8, height - 8)
}

export const signTexture = (slogan: string, paint: SignPaint) =>
  cached(`sign:${slogan}:${paint.board}`, () => canvas(512, 344, ctx => paintSign(ctx, slogan, paint, 512, 344)))

function paintBanner(ctx: CanvasRenderingContext2D, text: string, width: number, height: number) {
  const random = seeded(text.length * 13)
  ctx.fillStyle = '#f4efe1'
  ctx.fillRect(0, 0, width, height)
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = 'rgba(120,100,70,0.06)'
    ctx.lineWidth = 1 + random() * 3
    ctx.beginPath()
    const y = random() * height
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(width * 0.3, y + 10, width * 0.6, y - 10, width, y + 4)
    ctx.stroke()
  }
  ctx.fillStyle = '#c1121f'
  ctx.fillRect(0, 0, width, 16)
  ctx.fillRect(0, height - 16, width, 16)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 132
  do {
    ctx.font = `900 ${size}px ${BRUSH}`
    size -= 4
  } while (ctx.measureText(text).width > width * 0.92 && size > 24)
  ctx.fillStyle = '#b3121b'
  handLettering(ctx, text, width / 2, height / 2 + 4, random)
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = 'rgba(179,18,27,0.75)'
    const x = width * 0.06 + random() * width * 0.88
    const y = height / 2 + size * 0.38
    ctx.fillRect(x, y, 3, 8 + random() * 26)
  }
}

export const bannerTexture = (text: string) => cached(`banner:${text}`, () => canvas(1800, 200, ctx => paintBanner(ctx, text, 1800, 200)))

function paintPlate(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#fbf7ea'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#8a1c1c'
  ctx.lineWidth = 12
  ctx.strokeRect(12, 12, width - 24, height - 24)
  ctx.fillStyle = '#8a1c1c'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `900 ${height * 0.46}px ${BRUSH}`
  ctx.fillText('VOLTO JÁ', width * 0.42, height / 2 + 6)
  ctx.font = `${height * 0.5}px "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.fillText('☕', width * 0.85, height / 2 + 4)
}

export const plateTexture = () => cached('plate', () => canvas(720, 220, ctx => paintPlate(ctx, 720, 220)))

function paintJumpSign(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#ffd400'
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, width, 30)
  ctx.rect(0, height - 30, width, 30)
  ctx.clip()
  for (let x = -height; x < width + height; x += 56) {
    ctx.fillStyle = '#151515'
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + 28, 0)
    ctx.lineTo(x + 28 + height, height)
    ctx.lineTo(x + height, height)
    ctx.fill()
  }
  ctx.restore()
  ctx.fillStyle = '#d00000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `900 132px ${BRUSH}`
  ctx.fillText('FURA-FILA!', width / 2, height / 2 + 6)
}

export const jumpSignTexture = () => cached('jump', () => canvas(800, 260, ctx => paintJumpSign(ctx, 800, 260)))

function paintNoDeploy(ctx: CanvasRenderingContext2D, width: number, height: number, lit: boolean) {
  ctx.fillStyle = lit ? '#2a0303' : '#e9e4d8'
  ctx.fillRect(0, 0, width, height)
  const red = lit ? '#ff2a1f' : '#9b4a44'
  const cx = height * 0.52
  const r = height * 0.34
  ctx.globalAlpha = lit ? 1 : 0.55
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${r * 1.15}px "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.fillText('🚀', cx, height / 2 + r * 0.06)
  ctx.globalAlpha = 1
  ctx.strokeStyle = red
  ctx.lineWidth = height * 0.075
  ctx.beginPath()
  ctx.arc(cx, height / 2, r, 0, Math.PI * 2)
  ctx.moveTo(cx - r * 0.7, height / 2 - r * 0.7)
  ctx.lineTo(cx + r * 0.7, height / 2 + r * 0.7)
  ctx.stroke()
  ctx.textAlign = 'left'
  ctx.font = `900 ${height * 0.2}px ${BRUSH}`
  ctx.fillStyle = red
  ;['PROIBIDO', 'DEPLOY', 'NA SEXTA'].forEach((line, i) => ctx.fillText(line, height * 1.0, height * (0.25 + i * 0.25)))
}

export const noDeployTexture = (lit: boolean) => cached(`nodeploy:${lit}`, () => canvas(1024, 400, ctx => paintNoDeploy(ctx, 1024, 400, lit)))
