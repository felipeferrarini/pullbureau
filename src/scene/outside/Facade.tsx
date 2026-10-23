'use client'

import { t, DISPLAY_NAME } from '@/i18n'


import { Text } from '@react-three/drei'
import { ENTRANCE_HALF, FACADE_Z, hallWidth } from '../layout'
import { FONT_URL } from '../fonts'
import { useSkyLook } from '../render/SkyContext'
import { Cutaway } from './Cutaway'
import { GlassDoors } from './GlassDoors'
import { Flagpoles } from './Flagpoles'
import { Porch } from './Porch'

export const ENTRANCE = ENTRANCE_HALF * 2
export const STUB = 0.9
const TOP = 7.4
const DOOR_TOP = 2.85
const THICKNESS = 0.26
const WINDOW = { bottom: 1.9, height: 3.1, width: 1.9 }
const WINDOW_STEP = 4.2
const FIRST_WINDOW_X = 7.4

const COLORS = {
  wall: '#ead8b0',
  trim: '#f7f1e3',
  stone: '#8f8a82',
  band: '#5e8f72',
  sign: '#1f4d3a',
  gold: '#e2bd62',
  goldDeep: '#8a6a2a',
  frame: '#f4f1ea',
  glassDay: '#4f6f86',
  glassNight: '#ffd391',
}

function windowXs(width: number): number[] {
  const xs: number[] = []
  for (let x = FIRST_WINDOW_X; x <= width / 2 - 1.8; x += WINDOW_STEP) xs.push(x, -x)
  return xs
}

function Stub({ width }: { width: number }) {
  const side = (width - ENTRANCE) / 2
  return (
    <>
      {[-1, 1].map(dir => (
        <group key={dir} position={[dir * (ENTRANCE / 2 + side / 2), 0, 0]}>
          <mesh position={[0, STUB / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[side, STUB, THICKNESS]} />
            <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
          </mesh>
          <mesh position={[0, STUB / 2 - 0.1, -THICKNESS / 2 - 0.01]}>
            <boxGeometry args={[side, STUB - 0.2, 0.02]} />
            <meshStandardMaterial color={COLORS.band} roughness={0.35} />
          </mesh>
          <mesh position={[0, STUB + 0.03, 0]} castShadow>
            <boxGeometry args={[side + 0.04, 0.06, THICKNESS + 0.08]} />
            <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function FacadeWindow({ x }: { x: number }) {
  const night = useSkyLook().lampsOn
  const y = WINDOW.bottom - STUB + WINDOW.height / 2
  return (
    <group position={[x, y, THICKNESS / 2]}>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[WINDOW.width + 0.24, WINDOW.height + 0.24, 0.06]} />
        <meshStandardMaterial color={COLORS.frame} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[WINDOW.width, WINDOW.height]} />
        <meshStandardMaterial color={night ? COLORS.glassNight : COLORS.glassDay} emissive={night ? COLORS.glassNight : '#000000'} emissiveIntensity={night ? 1.3 : 0} roughness={0.08} metalness={0.4} />
      </mesh>
      {[-0.25, 0.25].map(k => (
        <mesh key={k} position={[0, k * WINDOW.height, 0.08]}>
          <boxGeometry args={[WINDOW.width, 0.05, 0.03]} />
          <meshStandardMaterial color={COLORS.frame} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[0.05, WINDOW.height, 0.03]} />
        <meshStandardMaterial color={COLORS.frame} />
      </mesh>
      <mesh position={[0, -WINDOW.height / 2 - 0.16, 0.12]} castShadow>
        <boxGeometry args={[WINDOW.width + 0.5, 0.08, 0.24]} />
        <meshStandardMaterial color={COLORS.trim} />
      </mesh>
      <mesh position={[0, WINDOW.height / 2 + 0.3, 0.1]} castShadow>
        <boxGeometry args={[WINDOW.width + 0.6, 0.14, 0.2]} />
        <meshStandardMaterial color={COLORS.trim} />
      </mesh>
    </group>
  )
}

function RaisedLetters({ text, size, y }: { text: string; size: number; y: number }) {
  const layers = [
    { z: 0, color: COLORS.goldDeep },
    { z: 0.025, color: '#b8913f' },
    { z: 0.05, color: COLORS.gold },
  ]
  return (
    <group position={[0, y, 0]}>
      {layers.map(layer => (
        <Text key={layer.z} font={FONT_URL} position={[0, 0, layer.z]} fontSize={size} letterSpacing={0.06} color={layer.color} anchorX="center" anchorY="middle">
          {text}
        </Text>
      ))}
    </group>
  )
}

function Sign() {
  const lit = useSkyLook().lampsOn
  return (
    <group position={[0, 4.9 - STUB, THICKNESS / 2 + 0.02]}>
      <mesh castShadow>
        <boxGeometry args={[12.4, 1.35, 0.12]} />
        <meshStandardMaterial color={COLORS.sign} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[12.7, 1.6, 0.08]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>
      <group position={[0, 0, 0.07]}>
        <RaisedLetters text={t('ui.organizationTechnologyBureau', { organization: DISPLAY_NAME })} size={0.46} y={0.12} />
        <Text font={FONT_URL} position={[0, -0.42, 0.06]} fontSize={0.17} letterSpacing={0.3} color="#cfe6d8" anchorX="center" anchorY="middle">
          {t('ui.pullRequestContributorService')}
        </Text>
      </group>
      {lit && <pointLight position={[0, -0.2, 1.4]} color="#ffe1a8" intensity={3.5} distance={5} decay={1.6} />}
    </group>
  )
}

function UpperFacade({ width }: { width: number }) {
  const side = (width - ENTRANCE) / 2
  const height = TOP - STUB
  return (
    <Cutaway position={[0, STUB, 0]}>
      {[-1, 1].map(dir => (
        <mesh key={dir} position={[dir * (ENTRANCE / 2 + side / 2), height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[side, height, THICKNESS]} />
          <meshStandardMaterial color={COLORS.wall} roughness={0.92} />
        </mesh>
      ))}
      <mesh position={[0, (DOOR_TOP - STUB + height) / 2, 0]} castShadow>
        <boxGeometry args={[ENTRANCE, height - (DOOR_TOP - STUB), THICKNESS]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.12, THICKNESS / 2 + 0.03]}>
        <boxGeometry args={[width, 0.22, 0.08]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>
      <mesh position={[0, height - 0.2, 0.08]} castShadow>
        <boxGeometry args={[width + 0.4, 0.4, THICKNESS + 0.3]} />
        <meshStandardMaterial color={COLORS.trim} roughness={0.5} />
      </mesh>
      <mesh position={[0, height + 0.18, 0]} castShadow>
        <boxGeometry args={[width + 0.2, 0.36, THICKNESS]} />
        <meshStandardMaterial color={COLORS.wall} roughness={0.9} />
      </mesh>
      {windowXs(width).map(x => (
        <FacadeWindow key={x} x={x} />
      ))}
      {windowXs(width).map(x => (
        <mesh key={`p${x}`} position={[x + Math.sign(x) * WINDOW_STEP * 0.5, height / 2 - 0.2, THICKNESS / 2 + 0.06]} castShadow>
          <boxGeometry args={[0.42, height - 0.6, 0.12]} />
          <meshStandardMaterial color={COLORS.trim} roughness={0.6} />
        </mesh>
      ))}
      <Sign />
    </Cutaway>
  )
}

function AnnexFront({ from, to }: { from: number; to: number }) {
  const width = to - from
  const x = (from + to) / 2
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, STUB / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, STUB, THICKNESS]} />
        <meshStandardMaterial color="#d8ccb0" roughness={0.95} />
      </mesh>
      <Cutaway position={[0, STUB, 0]}>
        <mesh position={[0, (TOP - 1.2 - STUB) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, TOP - 1.2 - STUB, THICKNESS]} />
          <meshStandardMaterial color="#d8ccb0" roughness={0.95} />
        </mesh>
        <group position={[0, 3.4 - STUB, THICKNESS / 2 + 0.03]}>
          <mesh>
            <boxGeometry args={[Math.min(width - 0.6, 4.2), 0.55, 0.05]} />
            <meshStandardMaterial color="#8a5a3c" roughness={0.8} />
          </mesh>
          <Text font={FONT_URL} position={[0, 0, 0.04]} fontSize={0.2} color="#f3e9d2" anchorX="center" anchorY="middle" letterSpacing={0.12}>
            {t('ui.annexArchives')}
          </Text>
        </group>
      </Cutaway>
    </group>
  )
}

function Plinth({ minX, maxX, backZ }: { minX: number; maxX: number; backZ: number }) {
  return (
    <mesh position={[(minX + maxX) / 2, -0.23, (backZ + FACADE_Z) / 2]} receiveShadow>
      <boxGeometry args={[maxX - minX + 0.5, 0.45, FACADE_Z - backZ + 0.3]} />
      <meshStandardMaterial color={COLORS.stone} roughness={0.85} />
    </mesh>
  )
}

type FacadeProps = { count: number; minX: number; maxX: number; backZ: number }

export function Facade({ count, minX, maxX, backZ }: FacadeProps) {
  const width = hallWidth(count)
  return (
    <group>
      <Plinth minX={minX} maxX={maxX} backZ={backZ} />
      <group position={[0, 0, FACADE_Z]}>
        <Stub width={width} />
        <UpperFacade width={width} />
        <GlassDoors width={ENTRANCE} height={DOOR_TOP} />
        {maxX > width / 2 + 0.5 && <AnnexFront from={width / 2 + 0.1} to={maxX + 0.1} />}
      </group>
      <Porch />
      <Flagpoles />
    </group>
  )
}
