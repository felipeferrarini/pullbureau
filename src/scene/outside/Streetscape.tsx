'use client'

import { useMemo } from 'react'
import { BACK_WALL_Z, FACADE_Z } from '../layout'
import { CURB_HEIGHT, CURB_Z, FAR_SIDEWALK, ROAD, ROAD_WIDTH, ROAD_Y, SIDEWALK_Y, STREET_HALF_LENGTH } from './street'
import { paintAsphalt, paintCalcada, paintSlabs, toTexture } from './textures'

const CALCADA_TILE = 2.4
const SLAB_TILE = 1.6
const CALCADA_FROM_Z = FACADE_Z - 2
const ROAD_TILE = 4
const BACK_DEPTH = 60
const GROUND_SIZE = 900
const ZEBRA = { width: 4.2, bar: 0.45, gap: 0.45, x: 0 }
const CURB_DEPTH = 0.28

function Sidewalk() {
  const depth = CURB_Z - CALCADA_FROM_Z
  const length = STREET_HALF_LENGTH * 2
  const map = useMemo(() => toTexture(paintCalcada(), length / CALCADA_TILE, depth / CALCADA_TILE), [length, depth])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, SIDEWALK_Y, (CALCADA_FROM_Z + CURB_Z) / 2]} receiveShadow>
      <planeGeometry args={[length, depth]} />
      <meshStandardMaterial map={map} roughness={0.85} />
    </mesh>
  )
}

function BackLot() {
  const near = BACK_WALL_Z - BACK_DEPTH
  const depth = CALCADA_FROM_Z - near
  const map = useMemo(() => toTexture(paintSlabs(), (STREET_HALF_LENGTH * 2) / SLAB_TILE, depth / SLAB_TILE), [depth])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, SIDEWALK_Y - 0.002, (near + CALCADA_FROM_Z) / 2]} receiveShadow>
      <planeGeometry args={[STREET_HALF_LENGTH * 2, depth]} />
      <meshStandardMaterial map={map} roughness={0.95} />
    </mesh>
  )
}

function Road() {
  const length = STREET_HALF_LENGTH * 2
  const map = useMemo(() => toTexture(paintAsphalt(), length / ROAD_TILE, 1), [length])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, ROAD_Y, (ROAD.near + ROAD.far) / 2]} receiveShadow>
      <planeGeometry args={[length, ROAD_WIDTH]} />
      <meshStandardMaterial map={map} roughness={0.92} />
    </mesh>
  )
}

function Zebra() {
  const bars = Math.floor((ROAD_WIDTH - 0.8) / (ZEBRA.bar + ZEBRA.gap))
  const start = ROAD.near + (ROAD_WIDTH - bars * (ZEBRA.bar + ZEBRA.gap) + ZEBRA.gap) / 2
  return (
    <group>
      {Array.from({ length: bars }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[ZEBRA.x, ROAD_Y + 0.006, start + i * (ZEBRA.bar + ZEBRA.gap) + ZEBRA.bar / 2]} receiveShadow>
          <planeGeometry args={[ZEBRA.width, ZEBRA.bar]} />
          <meshStandardMaterial color="#efece4" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Curb({ z }: { z: number }) {
  return (
    <mesh position={[0, ROAD_Y + CURB_HEIGHT / 2 - 0.005, z]} receiveShadow castShadow>
      <boxGeometry args={[STREET_HALF_LENGTH * 2, CURB_HEIGHT + 0.01, CURB_DEPTH]} />
      <meshStandardMaterial color="#bdb8ad" roughness={0.8} />
    </mesh>
  )
}

function FarSidewalk() {
  const depth = FAR_SIDEWALK.far - FAR_SIDEWALK.near + 30
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, SIDEWALK_Y, FAR_SIDEWALK.near + depth / 2]} receiveShadow>
      <planeGeometry args={[STREET_HALF_LENGTH * 2, depth]} />
      <meshStandardMaterial color="#c9c2b4" roughness={0.9} />
    </mesh>
  )
}

export function Streetscape() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, ROAD_Y - 0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color="#9c9a8f" roughness={1} />
      </mesh>
      <BackLot />
      <Sidewalk />
      <Curb z={CURB_Z + CURB_DEPTH / 2} />
      <Road />
      <Zebra />
      <Curb z={FAR_SIDEWALK.near - CURB_DEPTH / 2} />
      <FarSidewalk />
    </group>
  )
}
