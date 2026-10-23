import type { Sky, SkyPhase } from '@/types/eggs'
import type { SkyLook } from '@/types/outside'
import type { Vec3 } from '@/types/scene'

type Palette = Omit<SkyLook, 'phase' | 'sunDirection' | 'night' | 'lampsOn'>

const PALETTES: Record<SkyPhase, Palette> = {
  day: {
    zenith: '#4f93db', horizon: '#d6ebf7', fog: '#d3e4ee', sunColor: '#fff1d6', sunIntensity: 2.1,
    hemiSky: '#cfe3ff', hemiGround: '#b79b7a', hemiIntensity: 0.24, envIntensity: 0.3, stars: 0, interior: 0,
  },
  dawn: {
    zenith: '#5f72b8', horizon: '#ffcf9e', fog: '#e9cdb6', sunColor: '#ffc690', sunIntensity: 1.35,
    hemiSky: '#ffd9b8', hemiGround: '#8a6f5a', hemiIntensity: 0.24, envIntensity: 0.22, stars: 0.15, interior: 0.5,
  },
  dusk: {
    zenith: '#34407e', horizon: '#ff9a62', fog: '#d9a088', sunColor: '#ff9d5c', sunIntensity: 1.15,
    hemiSky: '#ffb48a', hemiGround: '#6b5547', hemiIntensity: 0.22, envIntensity: 0.2, stars: 0.35, interior: 0.65,
  },
  night: {
    zenith: '#050a1c', horizon: '#1b2a52', fog: '#151f3b', sunColor: '#a9bfff', sunIntensity: 0.34,
    hemiSky: '#3a4f86', hemiGround: '#17161f', hemiIntensity: 0.18, envIntensity: 0.24, stars: 1, interior: 1,
  },
}

const MIN_ELEVATION = 0.32
const MAX_ELEVATION = 0.78
const MOON: Vec3 = [0.45, 0.62, 0.64]

const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v)
  return [v[0] / length, v[1] / length, v[2] / length]
}

// The sun crosses from the left (morning) to the right (afternoon), never straight overhead, so shadows stay long.
export function sunDirection(sky: Sky): Vec3 {
  if (sky.phase === 'night') return normalize(MOON)
  const elevation = MIN_ELEVATION + (MAX_ELEVATION - MIN_ELEVATION) * Math.sin(Math.PI * sky.sun)
  const sweep = -Math.cos(Math.PI * sky.sun) * 0.85
  return normalize([sweep * Math.cos(elevation), Math.sin(elevation), 0.55 * Math.cos(elevation)])
}

export function skyLook(sky: Sky): SkyLook {
  const night = sky.phase === 'night'
  return { ...PALETTES[sky.phase], phase: sky.phase, sunDirection: sunDirection(sky), night, lampsOn: sky.phase !== 'day' }
}
