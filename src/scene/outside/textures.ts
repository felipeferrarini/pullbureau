import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

export function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function canvas2d(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return [canvas, canvas.getContext('2d')]
}

export function toTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

const CALCADA_PX = 1024
const STONE_PX = 15
const WAVE_BANDS = 3
const WAVE_AMPLITUDE = 0.09

const shade = (base: number, jitter: number) => Math.max(0, Math.min(255, Math.round(base + jitter)))

// Copacabana-style waves: black basalt and white limestone set in a sinuous pattern, one wavelength per tile.
export function paintCalcada(seed = 7): HTMLCanvasElement {
  const [canvas, ctx] = canvas2d(CALCADA_PX, CALCADA_PX)
  if (!ctx) return canvas
  const random = seeded(seed)
  ctx.fillStyle = '#8f8a80'
  ctx.fillRect(0, 0, CALCADA_PX, CALCADA_PX)
  for (let y = 0; y < CALCADA_PX; y += STONE_PX) {
    for (let x = 0; x < CALCADA_PX; x += STONE_PX) {
      const cx = x + STONE_PX / 2
      const cy = y + STONE_PX / 2
      const wave = cy / CALCADA_PX + WAVE_AMPLITUDE * Math.sin((2 * Math.PI * cx) / CALCADA_PX)
      const dark = ((((wave * WAVE_BANDS) % 1) + 1) % 1) < 0.5
      const base = dark ? 88 : 222
      const jitter = (random() - 0.5) * (dark ? 22 : 26)
      const tint = dark ? 0 : (random() - 0.5) * 10
      ctx.fillStyle = `rgb(${shade(base + tint, jitter)},${shade(base, jitter)},${shade(base - tint, jitter)})`
      ctx.beginPath()
      for (let corner = 0; corner < 4; corner++) {
        const px = x + (corner === 1 || corner === 2 ? STONE_PX : 0) + (random() - 0.5) * 3 + (corner === 1 || corner === 2 ? -1.6 : 1.6)
        const py = y + (corner >= 2 ? STONE_PX : 0) + (random() - 0.5) * 3 + (corner >= 2 ? -1.6 : 1.6)
        ctx.lineTo(px, py)
      }
      ctx.fill()
    }
  }
  return canvas
}

const ROAD_PX_X = 512
const ROAD_PX_Z = 1024

// One tile is 4 m of road (u) by the full 8 m width (v): edge lines and a dashed yellow centre line.
export function paintAsphalt(seed = 11): HTMLCanvasElement {
  const [canvas, ctx] = canvas2d(ROAD_PX_X, ROAD_PX_Z)
  if (!ctx) return canvas
  const random = seeded(seed)
  ctx.fillStyle = '#4a4b4f'
  ctx.fillRect(0, 0, ROAD_PX_X, ROAD_PX_Z)
  for (let i = 0; i < 9000; i++) {
    const v = 50 + random() * 60
    ctx.fillStyle = `rgba(${v},${v},${v + 4},${0.25 + random() * 0.4})`
    ctx.fillRect(random() * ROAD_PX_X, random() * ROAD_PX_Z, 1 + random() * 2.5, 1 + random() * 2.5)
  }
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(30,30,32,${0.08 + random() * 0.08})`
    ctx.beginPath()
    ctx.ellipse(random() * ROAD_PX_X, random() * ROAD_PX_Z, 30 + random() * 90, 10 + random() * 30, random() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  const metre = ROAD_PX_Z / 8
  ctx.fillStyle = '#e9e6dc'
  ctx.fillRect(0, metre * 0.3, ROAD_PX_X, metre * 0.12)
  ctx.fillRect(0, ROAD_PX_Z - metre * 0.42, ROAD_PX_X, metre * 0.12)
  ctx.fillStyle = '#e8b830'
  ctx.fillRect(0, ROAD_PX_Z / 2 - metre * 0.06, ROAD_PX_X / 2, metre * 0.12)
  return canvas
}

const WINDOW_PX = 64
const WINDOW_GRID = 8

// An 8×8 block of windows; `lit` paints only the warm glow of the occupied ones (for the emissive map).
export function paintWindows(seed: number, lit: boolean): HTMLCanvasElement {
  const size = WINDOW_PX * WINDOW_GRID
  const [canvas, ctx] = canvas2d(size, size)
  if (!ctx) return canvas
  const random = seeded(seed)
  ctx.fillStyle = lit ? '#000000' : '#ffffff'
  ctx.fillRect(0, 0, size, size)
  for (let row = 0; row < WINDOW_GRID; row++) {
    for (let col = 0; col < WINDOW_GRID; col++) {
      const x = col * WINDOW_PX
      const y = row * WINDOW_PX
      const on = random() < 0.45
      if (lit) {
        if (!on) continue
        const warm = random() < 0.8
        ctx.fillStyle = warm ? `rgb(255,${200 + Math.floor(random() * 30)},${130 + Math.floor(random() * 40)})` : '#cfe3ff'
        ctx.fillRect(x + 14, y + 12, WINDOW_PX - 28, WINDOW_PX - 26)
        continue
      }
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(x + 10, y + 8, WINDOW_PX - 20, WINDOW_PX - 18)
      ctx.fillStyle = '#f7f4ec'
      ctx.fillRect(x + 12, y + 10, WINDOW_PX - 24, WINDOW_PX - 22)
      const glass = 70 + Math.floor(random() * 40)
      ctx.fillStyle = `rgb(${glass},${glass + 18},${glass + 36})`
      ctx.fillRect(x + 14, y + 12, WINDOW_PX - 28, WINDOW_PX - 26)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(x + 14, y + 12, (WINDOW_PX - 28) / 2, WINDOW_PX - 26)
      ctx.fillStyle = '#f7f4ec'
      ctx.fillRect(x + WINDOW_PX / 2 - 1, y + 12, 2, WINDOW_PX - 26)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(x + 10, y + WINDOW_PX - 10, WINDOW_PX - 20, 3)
    }
  }
  return canvas
}

export const WINDOWS_PER_TILE = WINDOW_GRID

const SLAB_PX = 256

// Plain concrete slabs with joints, for the side alleys and the lot behind the building.
export function paintSlabs(seed = 3): HTMLCanvasElement {
  const [canvas, ctx] = canvas2d(SLAB_PX, SLAB_PX)
  if (!ctx) return canvas
  const random = seeded(seed)
  ctx.fillStyle = '#cfc8b9'
  ctx.fillRect(0, 0, SLAB_PX, SLAB_PX)
  for (let i = 0; i < 2500; i++) {
    const v = 180 + Math.floor(random() * 40)
    ctx.fillStyle = `rgba(${v},${v - 6},${v - 16},0.35)`
    ctx.fillRect(random() * SLAB_PX, random() * SLAB_PX, 2, 2)
  }
  ctx.strokeStyle = 'rgba(110,100,86,0.55)'
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, SLAB_PX, SLAB_PX)
  return canvas
}
