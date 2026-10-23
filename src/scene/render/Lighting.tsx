'use client'

import { Environment } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { DirectionalLight } from 'three'
import { isDiscoOn, useEggStore } from '@/eggs/eggStore'
import { HDRI_DAY, HDRI_NIGHT } from '@/shared/props'
import type { Vec3 } from '@/types/scene'
import { BACK_WALL_Z, FACADE_Z } from '../layout'
import { useQualityProfile } from './quality'
import { useSkyLook } from './SkyContext'

const SHADOW_PAD = 4
const SHADOW_REFERENCE = 4096
const SUN_DISTANCE = 32
const INTERIOR_COLOR = '#ffe8c4'
const INTERIOR_Y = 4.6
const INTERIOR_STEP = 9
const INTERIOR_INTENSITY = 9
const DISCO_DIM = 0.28
const INTERIOR_ROWS = [BACK_WALL_Z + 4.5, FACADE_Z - 6]

function interiorSpots(minX: number, maxX: number): Vec3[] {
  const count = Math.max(1, Math.round((maxX - minX) / INTERIOR_STEP))
  const step = (maxX - minX) / count
  return INTERIOR_ROWS.flatMap(z => Array.from({ length: count }, (_, i): Vec3 => [minX + step * (i + 0.5), INTERIOR_Y, z]))
}

export function Lighting({ minX, maxX }: { minX: number; maxX: number }) {
  const look = useSkyLook()
  const dim = useEggStore(state => (isDiscoOn(state) ? DISCO_DIM : 1))
  const sun = useRef<DirectionalLight>(null)
  const centerX = (minX + maxX) / 2
  const centerZ = (FACADE_Z + BACK_WALL_Z) / 2
  const half = (maxX - minX) / 2 + SHADOW_PAD
  const [dx, dy, dz] = look.sunDirection
  const spots = useMemo(() => interiorSpots(minX, maxX), [minX, maxX])
  const mapSize = Math.max(512, useQualityProfile().shadowMapSize)
  // Biases were tuned on a 4096 map; coarser maps need proportionally more to stay free of acne.
  const texel = SHADOW_REFERENCE / mapSize

  useLayoutEffect(() => {
    const light = sun.current
    if (!light || light.shadow.mapSize.x === mapSize) return
    light.shadow.mapSize.set(mapSize, mapSize)
    light.shadow.map?.dispose()
    light.shadow.map = null
  }, [mapSize])

  useLayoutEffect(() => {
    const light = sun.current
    if (!light) return
    light.target.position.set(centerX, 0, centerZ)
    light.target.updateMatrixWorld()
    light.shadow.camera.updateProjectionMatrix()
  }, [centerX, centerZ, half])

  return (
    <>
      <Environment files={look.night ? HDRI_NIGHT : HDRI_DAY} environmentIntensity={look.envIntensity * dim} />
      <hemisphereLight args={[look.hemiSky, look.hemiGround]} intensity={look.hemiIntensity * dim} />
      <directionalLight
        ref={sun}
        position={[centerX + dx * SUN_DISTANCE, dy * SUN_DISTANCE, centerZ + dz * SUN_DISTANCE]}
        intensity={look.sunIntensity * dim}
        color={look.sunColor}
        castShadow
        shadow-bias={-0.0004 * texel}
        shadow-normalBias={0.03 * texel}
        shadow-radius={4}
        shadow-camera-left={-half}
        shadow-camera-right={half}
        shadow-camera-top={half}
        shadow-camera-bottom={-half}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />
      {look.interior > 0 &&
        spots.map(position => (
          <pointLight key={position.join()} position={position} color={INTERIOR_COLOR} intensity={INTERIOR_INTENSITY * look.interior} distance={18} decay={1.4} />
        ))}
    </>
  )
}
