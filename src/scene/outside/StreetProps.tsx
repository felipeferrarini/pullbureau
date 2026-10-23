'use client'

import { t, DISPLAY_NAME } from '@/i18n'


import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import type { PropPlacement, Vec3 } from '@/types/scene'
import { FACADE_Z } from '../layout'
import { FONT_URL } from '../fonts'
import { InstancedProp } from '../hall/InstancedProp'
import { DYNAMIC } from '../render/batchMeshes'
import { useSkyLook } from '../render/SkyContext'
import { CURB_Z, PLATFORM, SIDEWALK_Y, lampXs } from './street'

const TREE_Z = CURB_Z - 1.5
const BUS_STOP_X = 15
const CART: Vec3 = [5.6, SIDEWALK_Y, 13.9]
const LEAVES = { green: '#5c9a46', pink: '#e98fbf', yellow: '#f0c534' }
const BARK = '#6b4a35'

const at = (x: number, z: number, rotation = 0, scale = 1): PropPlacement => ({ position: [x, SIDEWALK_Y, z], rotation, scale })

function treeSpots(): { green: PropPlacement[]; pink: PropPlacement[]; yellow: PropPlacement[] } {
  const xs = lampXs().map(x => x + Math.sign(x) * 4).filter(x => Math.abs(x - BUS_STOP_X) > 2.6)
  const spots = { green: [] as PropPlacement[], pink: [] as PropPlacement[], yellow: [] as PropPlacement[] }
  xs.forEach((x, i) => {
    const kind = i % 5 === 1 ? 'pink' : i % 7 === 3 ? 'yellow' : 'green'
    spots[kind].push(at(x, TREE_Z, i * 1.7, 0.95 + (i % 3) * 0.12))
  })
  return spots
}

function Trees() {
  const spots = useMemo(() => treeSpots(), [])
  const pits = useMemo(() => [...spots.green, ...spots.pink, ...spots.yellow], [spots])
  return (
    <group>
      <InstancedProp id="tree-oak" placements={spots.green} colors={{ leafsGreen: LEAVES.green, woodBark: BARK }} />
      <InstancedProp id="tree-detailed" placements={spots.pink} colors={{ leafsGreen: LEAVES.pink, woodBark: BARK }} />
      <InstancedProp id="tree-default" placements={spots.yellow} colors={{ leafsGreen: LEAVES.yellow, woodBark: BARK }} />
      {pits.map(pit => (
        <mesh key={pit.position[0]} position={[pit.position[0], SIDEWALK_Y + 0.01, pit.position[2]]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[1.3, 1.3]} />
          <meshStandardMaterial color="#5a4433" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function Planters() {
  const bushes = useMemo<PropPlacement[]>(() => {
    const spots: PropPlacement[] = []
    for (let x = PLATFORM.minX - 1.6; x > PLATFORM.minX - 4.8; x -= 1.1) spots.push({ position: [x - 3.6, SIDEWALK_Y + 0.55, FACADE_Z + 0.45], scale: 0.8 })
    return spots
  }, [])
  // Only on the left: the overflowing lanes run along the facade to the right.
  const boxes = [{ x: PLATFORM.minX - 6.2, width: 3.8 }]
  return (
    <group>
      {boxes.map(box => (
        <mesh key={box.x} position={[box.x, SIDEWALK_Y + 0.28, FACADE_Z + 0.45]} castShadow receiveShadow>
          <boxGeometry args={[box.width, 0.56, 0.8]} />
          <meshStandardMaterial color="#b9b1a2" roughness={0.85} />
        </mesh>
      ))}
      <InstancedProp id="bush" placements={bushes} colors={{ grass: '#4f8a3c' }} />
    </group>
  )
}

function BusStop() {
  const lit = useSkyLook().lampsOn
  return (
    <group position={[BUS_STOP_X, SIDEWALK_Y, CURB_Z - 1.6]}>
      {[-1.6, 1.6].map(x => (
        <mesh key={x} position={[x, 1.25, -0.55]} castShadow>
          <boxGeometry args={[0.08, 2.5, 0.08]} />
          <meshStandardMaterial color="#2f3a33" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 2.55, 0]} rotation-x={0.08} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.08, 1.6]} />
        <meshStandardMaterial color="#1f4d3a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.35, -0.6]} renderOrder={2}>
        <boxGeometry args={[3.2, 1.9, 0.03]} />
        <meshStandardMaterial color="#cfe8ef" transparent opacity={0.35} depthWrite={false} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.48, -0.3]} castShadow>
        <boxGeometry args={[2.6, 0.06, 0.4]} />
        <meshStandardMaterial color="#c58b4a" roughness={0.7} />
      </mesh>
      <group position={[1.85, 1.3, -0.2]} rotation-y={-Math.PI / 2}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 1.8, 0.12]} />
          <meshStandardMaterial color="#2a2f33" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.065]}>
          <planeGeometry args={[0.86, 1.6]} />
          <meshStandardMaterial color="#ffe9a8" emissive="#ffd773" emissiveIntensity={lit ? 1.6 : 0.15} />
        </mesh>
        <Text font={FONT_URL} position={[0, 0.42, 0.075]} fontSize={0.11} maxWidth={0.8} textAlign="center" color="#1f4d3a" anchorX="center" anchorY="middle">
          {t('ui.yourPrApprovedIn24h')}
        </Text>
        <Text font={FONT_URL} position={[0, -0.1, 0.075]} fontSize={0.2} color="#b3261e" anchorX="center" anchorY="middle">
          {t('ui.organizationLabel', { organization: DISPLAY_NAME })}
        </Text>
        <Text font={FONT_URL} position={[0, -0.36, 0.075]} fontSize={0.07} letterSpacing={0.12} color="#1f4d3a" anchorX="center" anchorY="middle">
          {t('ui.brasiliaDf')}
        </Text>
        <Text font={FONT_URL} position={[0, -0.62, 0.075]} fontSize={0.06} color="#1f4d3a" anchorX="center" anchorY="middle">
          {t('ui.businessHoursQueuesApply')}
        </Text>
      </group>
      <group position={[-2.3, 0, 0.3]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.8, 8]} />
          <meshStandardMaterial color="#9aa0a5" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 2.6, 0.03]}>
          <boxGeometry args={[0.55, 0.5, 0.04]} />
          <meshStandardMaterial color="#1f5fa8" roughness={0.5} />
        </mesh>
        <Text font={FONT_URL} position={[0, 2.68, 0.06]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle">
          {t('ui.bus')}
        </Text>
        <Text font={FONT_URL} position={[0, 2.5, 0.06]} fontSize={0.055} color="#ffffff" anchorX="center" anchorY="middle">
          {t('ui.w3SouthBusStation')}
        </Text>
      </group>
    </group>
  )
}

function PopcornCart() {
  const lit = useSkyLook().lampsOn
  return (
    <group position={CART} rotation-y={-0.35}>
      {[-0.55, 0.55].map(x => (
        <mesh key={x} position={[x, 0.28, 0.45]} rotation-z={Math.PI / 2} castShadow>
          <torusGeometry args={[0.24, 0.05, 8, 18]} />
          <meshStandardMaterial color="#222" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.7, 0.9]} />
        <meshStandardMaterial color="#c8102e" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.85, 0.455]}>
        <planeGeometry args={[1.0, 0.36]} />
        <meshStandardMaterial color="#ffd23f" roughness={0.5} />
      </mesh>
      <Text font={FONT_URL} position={[0, 0.85, 0.46]} fontSize={0.16} color="#c8102e" anchorX="center" anchorY="middle">
        {t('ui.popcorn')}
      </Text>
      <mesh position={[0, 1.45, 0]} renderOrder={2}>
        <boxGeometry args={[1.0, 0.5, 0.7]} />
        <meshStandardMaterial color="#fff6d6" transparent opacity={0.4} depthWrite={false} emissive="#ffcc66" emissiveIntensity={lit ? 0.8 : 0} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.9, 0.18, 0.6]} />
        <meshStandardMaterial color="#fff2c4" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow>
        <coneGeometry args={[0.95, 0.5, 8]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <mesh position={[-0.75, 0.95, 0]} rotation-z={0.2}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </group>
  )
}

const PIGEON_SPOTS: [number, number, number][] = [
  [7.2, 13.6, 0.4], [7.9, 14.1, 2.2], [9.6, 13.4, -1.1], [10.2, 14.3, 3.0], [6.6, 12.9, 1.5], [9.1, 14.8, -2.4],
]

function Pigeon({ x, z, facing, seed }: { x: number; z: number; facing: number; seed: number }) {
  const head = useRef<Group>(null)
  const body = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed * 1.7
    const peck = Math.max(0, Math.sin(t * 2.3 + Math.sin(t * 0.7) * 2)) ** 6
    if (head.current) head.current.rotation.x = peck * 0.9
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(t * 3.1)) ** 12 * 0.05
      body.current.rotation.y = facing + Math.sin(t * 0.4 + seed) * 0.6
    }
  })
  return (
    <group position={[x, SIDEWALK_Y, z]} userData={DYNAMIC}>
      <group ref={body}>
        <mesh position={[0, 0.12, 0]} scale={[0.09, 0.08, 0.15]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#8a8f99" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.13, -0.15]} rotation-x={-0.3} scale={[0.06, 0.02, 0.09]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#5d6169" roughness={0.8} />
        </mesh>
        <group ref={head} position={[0, 0.17, 0.1]}>
          <mesh position={[0, 0.05, 0.03]} castShadow>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color="#6d7f8a" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.045, 0.085]} rotation-x={Math.PI / 2}>
            <coneGeometry args={[0.012, 0.04, 6]} />
            <meshStandardMaterial color="#d9a066" />
          </mesh>
        </group>
        {[-0.03, 0.03].map(dx => (
          <mesh key={dx} position={[dx, 0.03, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.06, 4]} />
            <meshStandardMaterial color="#d36b6b" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Orelhao({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
        <meshStandardMaterial color="#9aa0a5" metalness={0.5} />
      </mesh>
      <mesh position={[0, 2.0, 0.25]} scale={[0.62, 0.8, 0.55]} castShadow>
        <sphereGeometry args={[1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color="#f08a24" roughness={0.45} side={2} />
      </mesh>
      <mesh position={[0, 1.45, 0.08]}>
        <boxGeometry args={[0.28, 0.4, 0.12]} />
        <meshStandardMaterial color="#d9d4c8" roughness={0.5} />
      </mesh>
    </group>
  )
}

function Hydrant({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.7, 12]} />
        <meshStandardMaterial color="#c8102e" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c8102e" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.45, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.05, 0.05, 0.42, 8]} />
        <meshStandardMaterial color="#e2b23a" metalness={0.5} />
      </mesh>
    </group>
  )
}

const STREET_SIGN: Vec3 = [-5, SIDEWALK_Y, CURB_Z - 0.45]
const SIGN_BLUE = '#1d4f91'

function Plate({ y, width, text, size }: { y: number; width: number; text: string; size: number }) {
  return (
    <group position={[0, y, 0.04]}>
      <mesh castShadow>
        <boxGeometry args={[width, size * 2.4, 0.03]} />
        <meshStandardMaterial color={SIGN_BLUE} roughness={0.5} />
      </mesh>
      <Text font={FONT_URL} position={[0, 0, 0.02]} fontSize={size} letterSpacing={0.06} color="#ffffff" anchorX="center" anchorY="middle">
        {text}
      </Text>
    </group>
  )
}

// A street name plate at the crossing, the way Brasília names its avenues.
function StreetSign() {
  return (
    <group position={STREET_SIGN}>
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.7, 8]} />
        <meshStandardMaterial color="#9aa0a5" metalness={0.6} roughness={0.35} />
      </mesh>
      <Plate y={2.55} width={1.25} text={t('ui.w3South')} size={0.15} />
      <Plate y={2.15} width={1.55} text={t('ui.monumentalAxis')} size={0.1} />
    </group>
  )
}

export function StreetProps({ leftEdge }: { leftEdge: number }) {
  return (
    <group>
      <Trees />
      <Planters />
      <BusStop />
      <PopcornCart />
      <StreetSign />
      {PIGEON_SPOTS.map(([x, z, facing], i) => (
        <Pigeon key={i} x={x} z={z} facing={facing} seed={i} />
      ))}
      <Orelhao position={[leftEdge - 3.2, SIDEWALK_Y, CURB_Z - 1.6]} />
      <Hydrant position={[leftEdge - 1.2, SIDEWALK_Y, CURB_Z - 0.6]} />
      <InstancedProp id="trash-bin" placements={[at(BUS_STOP_X - 2.6, CURB_Z - 0.7), at(-9.5, CURB_Z - 0.7)]} />
    </group>
  )
}
