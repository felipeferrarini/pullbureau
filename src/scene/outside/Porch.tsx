'use client'

import { Text } from '@react-three/drei'
import { FACADE_Z } from '../layout'
import { FONT_URL } from '../fonts'
import { useSkyLook } from '../render/SkyContext'
import { Cutaway } from './Cutaway'
import { PLATFORM, RAMP, SIDEWALK_Y, STEP_COUNT, STEP_DEPTH, STEP_RISE, STEPS } from './street'

const STONE = '#c9c3b6'
const STONE_EDGE = '#a7a196'
const COLUMN = '#f4efe3'
const ROOF_Y = 3.35
const RAIL = '#5d6670'

function Platform() {
  const width = PLATFORM.maxX - PLATFORM.minX
  const depth = PLATFORM.maxZ - PLATFORM.minZ
  return (
    <mesh position={[0, SIDEWALK_Y / 2 - 0.005, (PLATFORM.minZ + PLATFORM.maxZ) / 2]} receiveShadow castShadow>
      <boxGeometry args={[width, -SIDEWALK_Y, depth]} />
      <meshStandardMaterial color={STONE} roughness={0.8} />
    </mesh>
  )
}

function Steps() {
  const width = STEPS.maxX - STEPS.minX
  return (
    <group>
      {Array.from({ length: STEP_COUNT }, (_, i) => {
        const top = -STEP_RISE * (i + 1)
        const height = top - SIDEWALK_Y
        return (
          <group key={i}>
            <mesh position={[0, SIDEWALK_Y + height / 2 - 0.005, STEPS.minZ + (i + 0.5) * STEP_DEPTH]} receiveShadow castShadow>
              <boxGeometry args={[width, height + 0.002, STEP_DEPTH]} />
              <meshStandardMaterial color={STONE} roughness={0.8} />
            </mesh>
            <mesh position={[0, top + 0.004, STEPS.minZ + i * STEP_DEPTH + 0.05]}>
              <boxGeometry args={[width, 0.012, 0.08]} />
              <meshStandardMaterial color="#e2b23a" roughness={0.6} />
            </mesh>
          </group>
        )
      })}
      <mesh position={[0, -0.004 / 2, STEPS.minZ + 0.04]}>
        <boxGeometry args={[width, 0.004, 0.06]} />
        <meshStandardMaterial color={STONE_EDGE} />
      </mesh>
    </group>
  )
}

function Ramp() {
  const length = Math.hypot(RAMP.maxX - RAMP.minX, -SIDEWALK_Y)
  const tilt = Math.atan2(-SIDEWALK_Y, RAMP.maxX - RAMP.minX)
  const depth = RAMP.maxZ - RAMP.minZ
  const z = (RAMP.minZ + RAMP.maxZ) / 2
  const railZ = RAMP.maxZ - 0.05
  return (
    <group>
      <mesh position={[(RAMP.minX + RAMP.maxX) / 2, SIDEWALK_Y / 2 - 0.06, z]} rotation-z={-tilt} receiveShadow castShadow>
        <boxGeometry args={[length, 0.12, depth]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>
      <mesh position={[(RAMP.minX + RAMP.maxX) / 2, SIDEWALK_Y / 2 + 0.9, railZ]} rotation-z={-Math.PI / 2 - tilt}>
        <cylinderGeometry args={[0.03, 0.03, length, 8]} />
        <meshStandardMaterial color={RAIL} metalness={0.6} roughness={0.35} />
      </mesh>
      {[0.05, 0.5, 0.95].map(k => {
        const x = RAMP.minX + (RAMP.maxX - RAMP.minX) * k
        const floor = SIDEWALK_Y * k
        return (
          <mesh key={k} position={[x, floor + 0.45, railZ]}>
            <cylinderGeometry args={[0.025, 0.025, 0.9, 8]} />
            <meshStandardMaterial color={RAIL} metalness={0.6} roughness={0.35} />
          </mesh>
        )
      })}
      <mesh position={[RAMP.minX + 0.6, 0.35, RAMP.maxZ + 0.02]} rotation-y={0}>
        <planeGeometry args={[0.32, 0.32]} />
        <meshStandardMaterial color="#1f5fa8" />
      </mesh>
      <Text font={FONT_URL} position={[RAMP.minX + 0.6, 0.35, RAMP.maxZ + 0.03]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle">
        ♿
      </Text>
    </group>
  )
}

function Portico() {
  const lit = useSkyLook().lampsOn
  const width = PLATFORM.maxX - PLATFORM.minX + 0.4
  const depth = PLATFORM.maxZ - PLATFORM.minZ + 0.25
  const columnZ = PLATFORM.maxZ - 0.25
  return (
    <Cutaway>
      {[PLATFORM.minX + 0.3, PLATFORM.maxX - 0.3].map(x => (
        <group key={x} position={[x, 0, columnZ]}>
          <mesh position={[0, ROOF_Y / 2, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.23, ROOF_Y, 16]} />
            <meshStandardMaterial color={COLUMN} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.6, 0.16, 0.6]} />
            <meshStandardMaterial color={STONE_EDGE} roughness={0.7} />
          </mesh>
          <mesh position={[0, ROOF_Y - 0.1, 0]}>
            <boxGeometry args={[0.55, 0.2, 0.55]} />
            <meshStandardMaterial color={COLUMN} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, ROOF_Y + 0.15, FACADE_Z + depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.3, depth]} />
        <meshStandardMaterial color={COLUMN} roughness={0.55} />
      </mesh>
      <mesh position={[0, ROOF_Y + 0.15, FACADE_Z + depth + 0.005]}>
        <boxGeometry args={[width, 0.12, 0.02]} />
        <meshStandardMaterial color="#1f4d3a" />
      </mesh>
      <mesh position={[0, ROOF_Y - 0.01, FACADE_Z + depth / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 20]} />
        <meshStandardMaterial color="#fff6dc" emissive="#ffe0a0" emissiveIntensity={lit ? 4 : 0.2} />
      </mesh>
      {lit && <pointLight position={[0, ROOF_Y - 0.3, FACADE_Z + depth / 2]} color="#ffdca0" intensity={5} distance={7} decay={1.5} />}
    </Cutaway>
  )
}

export function Porch() {
  return (
    <group>
      <Platform />
      <Steps />
      <Ramp />
      <Portico />
    </group>
  )
}
