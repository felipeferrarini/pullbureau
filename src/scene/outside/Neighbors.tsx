'use client'

import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import type { Texture } from 'three'
import type { Lot, Rect } from '@/types/outside'
import { FONT_URL } from '../fonts'
import { useSkyLook } from '../render/SkyContext'
import { neighborLots } from './city'
import { SIDEWALK_Y } from './street'
import { WINDOWS_PER_TILE, paintWindows, toTexture } from './textures'

const FLOOR = 3.1
const GROUND_FLOOR = 3.6
const WINDOW_WIDTH = 2.3
const SHOP_COLORS = ['#b3261e', '#1f4d3a', '#2b4c7e', '#e0a020', '#6d597a', '#3d5a4a']

type Maps = { day: HTMLCanvasElement; lit: HTMLCanvasElement }

function useWindowMaps(lot: Lot, maps: Maps, upper: number): { map: Texture; emissive: Texture } {
  return useMemo(() => {
    const repeatX = lot.width / WINDOW_WIDTH / WINDOWS_PER_TILE
    const repeatY = upper / FLOOR / WINDOWS_PER_TILE
    const map = toTexture(maps.day, repeatX, repeatY)
    const emissive = toTexture(maps.lit, repeatX, repeatY)
    map.offset.set((lot.seed % 7) / WINDOWS_PER_TILE, 0)
    emissive.offset.copy(map.offset)
    return { map, emissive }
  }, [lot, maps, upper])
}

function Shopfront({ lot }: { lot: Lot }) {
  const color = SHOP_COLORS[lot.seed % SHOP_COLORS.length]
  const front = (lot.depth / 2) * lot.facing
  return (
    <group position={[0, 0, front]} rotation-y={lot.facing === 1 ? 0 : Math.PI}>
      <mesh position={[0, 1.35, 0.03]}>
        <boxGeometry args={[lot.width - 1.2, 2.5, 0.06]} />
        <meshStandardMaterial color="#3c4a52" roughness={0.15} metalness={0.4} />
      </mesh>
      <mesh position={[0, 2.95, 0.5]} rotation-x={0.35} castShadow>
        <boxGeometry args={[lot.width - 0.8, 0.06, 1.1]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {lot.shop && (
        <group position={[0, 3.35, 0.08]}>
          <mesh>
            <boxGeometry args={[Math.min(lot.width - 0.6, 7.5), 0.6, 0.1]} />
            <meshStandardMaterial color="#fbf6e6" roughness={0.6} />
          </mesh>
          <Text font={FONT_URL} position={[0, 0, 0.06]} fontSize={0.3} maxWidth={lot.width - 1} color={color} anchorX="center" anchorY="middle">
            {lot.shop}
          </Text>
        </group>
      )}
    </group>
  )
}

function Building({ lot, maps, night }: { lot: Lot; maps: Maps; night: boolean }) {
  const upper = lot.height - GROUND_FLOOR
  const { map, emissive } = useWindowMaps(lot, maps, upper)
  const tankX = ((lot.seed % 5) - 2) * 0.12 * lot.width
  return (
    <group position={[lot.x, SIDEWALK_Y, lot.z]}>
      <mesh position={[0, GROUND_FLOOR / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[lot.width, GROUND_FLOOR, lot.depth]} />
        <meshStandardMaterial color={lot.color} roughness={0.9} />
      </mesh>
      <mesh position={[0, GROUND_FLOOR + upper / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[lot.width, upper, lot.depth]} />
        <meshStandardMaterial color={lot.color} map={map} emissiveMap={emissive} emissive="#ffffff" emissiveIntensity={night ? 1.1 : 0} roughness={0.85} />
      </mesh>
      <mesh position={[0, lot.height + 0.15, 0]} castShadow>
        <boxGeometry args={[lot.width + 0.3, 0.3, lot.depth + 0.3]} />
        <meshStandardMaterial color="#efe9dc" roughness={0.7} />
      </mesh>
      <mesh position={[tankX, lot.height + 0.95, -lot.facing * lot.depth * 0.15]} castShadow>
        <boxGeometry args={[1.6, 1.3, 1.6]} />
        <meshStandardMaterial color="#5b84a8" roughness={0.6} />
      </mesh>
      <Shopfront lot={lot} />
    </group>
  )
}

export function Neighbors({ footprint }: { footprint: Rect }) {
  const night = useSkyLook().lampsOn
  const lots = useMemo(() => neighborLots(footprint), [footprint])
  const maps = useMemo<Maps>(() => ({ day: paintWindows(5, false), lit: paintWindows(5, true) }), [])
  return (
    <group>
      {lots.map(lot => (
        <Building key={`${lot.x}:${lot.z}`} lot={lot} maps={maps} night={night} />
      ))}
    </group>
  )
}
