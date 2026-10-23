'use client'

import { useMemo } from 'react'
import { AdditiveBlending, CanvasTexture, DoubleSide } from 'three'
import { BACK_WALL_Z, FACADE_Z, WALL_HEIGHT } from '../layout'
import { useSkyLook } from '../render/SkyContext'
import { hallColors } from './colors'

export const WAINSCOT_HEIGHT = 1.3
const THICKNESS = 0.2
const SKIN = THICKNESS / 2

export type WallWindow = { at: number; bottom: number; width: number; height: number; beam?: boolean }
export type WallGap = { from: number; to: number; height: number }

type WallProps = {
  length: number
  position: [number, number, number]
  rotation: number
  windows?: WallWindow[]
  gap?: WallGap | null
  paint?: string
  band?: string
  skinOnly?: boolean
}

function useBeamTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 128)
      gradient.addColorStop(0, 'rgba(255,244,214,0.55)')
      gradient.addColorStop(1, 'rgba(255,244,214,0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 8, 128)
    }
    return new CanvasTexture(canvas)
  }, [])
}

function LightBeam({ window: w }: { window: WallWindow }) {
  const texture = useBeamTexture()
  const reach = 5.5
  const drop = w.bottom + w.height * 0.5
  const length = Math.hypot(reach, drop)
  const tilt = Math.atan2(reach, drop)
  return (
    <mesh position={[w.at, drop / 2 + 0.2, SKIN + reach / 2]} rotation={[tilt - Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[w.width * 0.95, length]} />
      <meshBasicMaterial map={texture} transparent opacity={0.22} depthWrite={false} blending={AdditiveBlending} side={DoubleSide} toneMapped={false} />
    </mesh>
  )
}

const NIGHT_GLASS = '#22315a'
const DUSK_GLASS = '#f2b08a'

function glassFor(phase: string) {
  if (phase === 'night') return { color: NIGHT_GLASS, glow: 0.35 }
  if (phase === 'day') return { color: hallColors.sky, glow: 0.85 }
  return { color: DUSK_GLASS, glow: 0.7 }
}

function Window({ window: w }: { window: WallWindow }) {
  const glass = glassFor(useSkyLook().phase)
  const y = w.bottom + w.height / 2
  const mullions = Math.max(1, Math.round(w.width / 0.9))
  return (
    <group position={[w.at, y, SKIN + 0.02]}>
      <mesh>
        <boxGeometry args={[w.width + 0.16, w.height + 0.16, 0.05]} />
        <meshStandardMaterial color={hallColors.frame} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w.width, w.height]} />
        <meshStandardMaterial color={glass.color} emissive={glass.color} emissiveIntensity={glass.glow} roughness={0.1} />
      </mesh>
      {Array.from({ length: mullions - 1 }, (_, i) => (
        <mesh key={i} position={[-w.width / 2 + ((i + 1) * w.width) / mullions, 0, 0.045]}>
          <boxGeometry args={[0.05, w.height, 0.03]} />
          <meshStandardMaterial color={hallColors.frame} roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.045]}>
        <boxGeometry args={[w.width, 0.05, 0.03]} />
        <meshStandardMaterial color={hallColors.frame} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, -w.height / 2 - 0.1, 0.08]}>
        <boxGeometry args={[w.width + 0.3, 0.06, 0.2]} />
        <meshStandardMaterial color={hallColors.sill} roughness={0.6} />
      </mesh>
    </group>
  )
}

type SlabProps = { from: number; to: number; paint: string; band: string; skinOnly: boolean }

function Slab({ from, to, paint, band, skinOnly }: SlabProps) {
  const length = to - from
  const x = (from + to) / 2
  if (length <= 0.01) return null
  return (
    <group position={[x, 0, 0]}>
      {!skinOnly && (
        <mesh position={[0, WALL_HEIGHT / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[length, WALL_HEIGHT, THICKNESS]} />
          <meshStandardMaterial color={paint} roughness={0.92} />
        </mesh>
      )}
      <mesh position={[0, WAINSCOT_HEIGHT / 2, SKIN + 0.012]} receiveShadow>
        <boxGeometry args={[length, WAINSCOT_HEIGHT, 0.024]} />
        <meshStandardMaterial color={band} roughness={0.35} />
      </mesh>
      <mesh position={[0, WAINSCOT_HEIGHT + 0.025, SKIN + 0.02]}>
        <boxGeometry args={[length, 0.05, 0.04]} />
        <meshStandardMaterial color={hallColors.bandTrim} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.06, SKIN + 0.03]}>
        <boxGeometry args={[length, 0.12, 0.06]} />
        <meshStandardMaterial color={hallColors.baseboard} roughness={0.5} />
      </mesh>
    </group>
  )
}

export function Wall({ length, position, rotation, windows = [], gap = null, paint = hallColors.paint, band = hallColors.band, skinOnly = false }: WallProps) {
  const night = useSkyLook().night
  const half = length / 2
  return (
    <group position={position} rotation-y={rotation}>
      {gap ? (
        <>
          <Slab from={-half} to={gap.from} paint={paint} band={band} skinOnly={skinOnly} />
          <Slab from={gap.to} to={half} paint={paint} band={band} skinOnly={skinOnly} />
          {!skinOnly && (
            <mesh position={[(gap.from + gap.to) / 2, (WALL_HEIGHT + gap.height) / 2, 0]} castShadow>
              <boxGeometry args={[gap.to - gap.from, WALL_HEIGHT - gap.height, THICKNESS]} />
              <meshStandardMaterial color={paint} roughness={0.92} />
            </mesh>
          )}
        </>
      ) : (
        <Slab from={-half} to={half} paint={paint} band={band} skinOnly={skinOnly} />
      )}
      {windows.map(w => (
        <group key={w.at}>
          <Window window={w} />
          {w.beam && !night && <LightBeam window={w} />}
        </group>
      ))}
    </group>
  )
}

const BACK_WINDOW = { bottom: 4.3, width: 3.2, height: 1.7 }
const SIDE_WINDOW = { bottom: 1.65, width: 2.4, height: 1.6 }
const BOARD_CLEARANCE = 10.5

export function backWindows(width: number): WallWindow[] {
  const half = width / 2 - 2.5
  const xs: number[] = []
  for (let x = BOARD_CLEARANCE; x <= half; x += 6.5) xs.push(x, -x)
  return xs.map(at => ({ ...BACK_WINDOW, at, beam: true }))
}

export function sideWindows(): WallWindow[] {
  const depth = FACADE_Z - BACK_WALL_Z
  return [-0.3, -0.05, 0.2].map(k => ({ ...SIDE_WINDOW, at: k * depth, beam: false }))
}
