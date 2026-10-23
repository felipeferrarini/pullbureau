import { CanvasTexture, SRGBColorSpace } from 'three'
import type { BrawlFrame, BrawlLimb, BrawlStar, BrawlWord } from '@/types/scene'
import { BRAWL_FRAMES, brawlFrames } from './brawlCloud'

export const FRAME_W = 256
export const FRAME_H = 192
export const ATLAS_COLUMNS = 4
export const ATLAS_ROWS = BRAWL_FRAMES / ATLAS_COLUMNS

const INK = '#2a2130'
const CLOUD_LIGHT = '#f3efe8'
const CLOUD_SHADE = '#c7bfcc'
const GLOVE = '#d62839'
const SLEEVE = '#3d5a80'
const SHOE = '#5b3a29'
const SOCK = '#efe9df'
const STAR = '#ffd23f'
const WORD = '#ffe066'
const WORD_SHADOW = '#e63946'
const CENTER: [number, number] = [FRAME_W / 2, FRAME_H * 0.54]
const LIMB_RX = 76
const LIMB_RY = 40
const PUFF_SCALE = 1
const OUTLINE = 4

const PUFFS: [number, number, number][] = [
  [0, 0, 46], [-42, 8, 34], [42, 8, 34], [-26, -24, 32], [26, -24, 32], [0, -36, 30], [-68, 18, 22], [68, 18, 22], [0, 26, 32], [-40, 34, 20], [40, 34, 20],
]

const wobbled = (wobble: number): [number, number, number][] =>
  PUFFS.map(([x, y, r], i) => [
    CENTER[0] + x * PUFF_SCALE + Math.cos(i * 2.3 + wobble) * 2.5,
    CENTER[1] + y * PUFF_SCALE + Math.sin(i * 1.7 + wobble) * 2,
    r * PUFF_SCALE + Math.sin(i * 3.1 + wobble) * 3,
  ])

function circles(ctx: CanvasRenderingContext2D, puffs: [number, number, number][], grow: number, shift: [number, number] = [0, 0], scale = 1) {
  ctx.beginPath()
  for (const [x, y, r] of puffs) {
    ctx.moveTo(x + shift[0] * r + r * scale + grow, y + shift[1] * r)
    ctx.arc(x + shift[0] * r, y + shift[1] * r, r * scale + grow, 0, Math.PI * 2)
  }
  ctx.fill()
}

// Toon cloud: an ink silhouette, a shaded body and a lighter top on every puff.
function drawCloud(ctx: CanvasRenderingContext2D, wobble: number) {
  const puffs = wobbled(wobble)
  ctx.fillStyle = INK
  circles(ctx, puffs, OUTLINE + 1)
  ctx.fillStyle = CLOUD_SHADE
  circles(ctx, puffs, 0)
  ctx.fillStyle = CLOUD_LIGHT
  circles(ctx, puffs, 0, [-0.1, -0.15], 0.82)
  drawSwirls(ctx, wobble)
}

const SWIRLS: [number, number, number, number][] = [[-46, -10, 16, 1], [40, 24, 14, -1], [18, -30, 10, 1]]

// Dust whirls spinning inside the cloud and two puffs kicked out at the bottom.
function drawSwirls(ctx: CanvasRenderingContext2D, wobble: number) {
  ctx.strokeStyle = INK
  ctx.lineWidth = 3
  for (const [x, y, r, turn] of SWIRLS) {
    ctx.beginPath()
    for (let k = 0; k <= 24; k++) {
      const a = wobble * turn + turn * k * 0.36
      const radius = r * (1 - k / 34)
      ctx.lineTo(CENTER[0] + x + Math.cos(a) * radius, CENTER[1] + y + Math.sin(a) * radius * 0.7)
    }
    ctx.stroke()
  }
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.arc(CENTER[0] + side * (92 + Math.sin(wobble) * 3), CENTER[1] + 52, 9, 0, Math.PI * 2)
    outlined(ctx, CLOUD_SHADE, 3)
  }
}

function outlined(ctx: CanvasRenderingContext2D, fill: string, width = OUTLINE) {
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = width
  ctx.strokeStyle = INK
  ctx.stroke()
}

function drawFist(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.rect(0, -8, 30, 16)
  outlined(ctx, SLEEVE)
  ctx.beginPath()
  ctx.ellipse(36, 0, 15, 14, 0, 0, Math.PI * 2)
  outlined(ctx, GLOVE)
  ctx.beginPath()
  ctx.ellipse(30, -12, 7, 5, -0.4, 0, Math.PI * 2)
  outlined(ctx, GLOVE, 3)
  ctx.beginPath()
  ctx.moveTo(44, -7)
  ctx.lineTo(44, 7)
  ctx.lineWidth = 2.5
  ctx.stroke()
}

function drawFoot(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.rect(0, -6, 24, 12)
  outlined(ctx, SOCK)
  ctx.beginPath()
  ctx.ellipse(34, 4, 17, 10, 0.15, 0, Math.PI * 2)
  outlined(ctx, SHOE)
  ctx.beginPath()
  ctx.moveTo(20, 13)
  ctx.lineTo(50, 10)
  ctx.lineWidth = 3
  ctx.stroke()
}

function drawLimb(ctx: CanvasRenderingContext2D, limb: BrawlLimb) {
  ctx.save()
  ctx.translate(CENTER[0] + Math.cos(limb.angle) * LIMB_RX, CENTER[1] - Math.sin(limb.angle) * LIMB_RY)
  ctx.rotate(-limb.angle)
  if (limb.kind === 'fist') drawFist(ctx)
  else drawFoot(ctx)
  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, star: BrawlStar) {
  const outer = star.size * FRAME_W
  ctx.save()
  ctx.translate(star.x * FRAME_W, star.y * FRAME_H)
  ctx.rotate(star.spin)
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? outer * 0.45 : outer
    const a = (i * Math.PI) / 5 - Math.PI / 2
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  ctx.closePath()
  outlined(ctx, STAR, 3)
  ctx.restore()
}

function drawWord(ctx: CanvasRenderingContext2D, word: BrawlWord) {
  ctx.save()
  ctx.translate(word.x * FRAME_W, word.y * FRAME_H)
  ctx.rotate(word.tilt)
  ctx.font = `900 ${Math.round(word.size * FRAME_W)}px Impact, "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 8
  ctx.strokeStyle = INK
  ctx.fillStyle = WORD_SHADOW
  ctx.strokeText(word.text, 3, 3)
  ctx.fillText(word.text, 3, 3)
  ctx.strokeText(word.text, 0, 0)
  ctx.fillStyle = WORD
  ctx.fillText(word.text, 0, 0)
  ctx.restore()
}

function drawFrame(ctx: CanvasRenderingContext2D, frame: BrawlFrame) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  frame.limbs.forEach(limb => drawLimb(ctx, limb))
  drawCloud(ctx, frame.wobble)
  frame.stars.forEach(star => drawStar(ctx, star))
  drawWord(ctx, frame.word)
}

function drawAtlas(number: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_W * ATLAS_COLUMNS
  canvas.height = FRAME_H * ATLAS_ROWS
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (ctx) {
    brawlFrames(number).forEach((frame, i) => {
      ctx.save()
      ctx.translate((i % ATLAS_COLUMNS) * FRAME_W, Math.floor(i / ATLAS_COLUMNS) * FRAME_H)
      ctx.beginPath()
      ctx.rect(0, 0, FRAME_W, FRAME_H)
      ctx.clip()
      drawFrame(ctx, frame)
      ctx.restore()
    })
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.repeat.set(1 / ATLAS_COLUMNS, 1 / ATLAS_ROWS)
  return texture
}

const atlases = new Map<number, CanvasTexture>()

// One atlas per PR number, shared by every cloud that shows it.
export function brawlAtlas(number: number): CanvasTexture {
  let atlas = atlases.get(number)
  if (!atlas) {
    atlas = drawAtlas(number)
    atlases.set(number, atlas)
  }
  return atlas
}

export function showFrame(atlas: CanvasTexture, frame: number) {
  const column = frame % ATLAS_COLUMNS
  const row = Math.floor(frame / ATLAS_COLUMNS)
  atlas.offset.set(column / ATLAS_COLUMNS, 1 - (row + 1) / ATLAS_ROWS)
}
