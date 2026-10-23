'use client'

import type { ThreeEvent } from '@react-three/fiber'
import type { Group, Object3D } from 'three'

export const DOG_COLORS = { coat: '#c8863d', dark: '#9a5a22', cream: '#f1d3a1', nose: '#2a1c14', tongue: '#e8737f' }

export type DogParts = { body: Group | null; head: Group | null; tail: Group | null; eyes: Group | null; tongue: Group | null; legs: (Group | null)[] }

const part = (root: Object3D, name: string) => (root.getObjectByName(name) as Group | undefined) ?? null

export const findDogParts = (root: Object3D): DogParts => ({
  body: part(root, 'dog-body'),
  head: part(root, 'dog-head'),
  tail: part(root, 'dog-tail'),
  eyes: part(root, 'dog-eyes'),
  tongue: part(root, 'dog-tongue'),
  legs: [0, 1, 2, 3].map(i => part(root, `dog-leg-${i}`)),
})

const HIP_Y = 0.3
const REAR_Z = -0.15
const LEGS: [number, number][] = [
  [0.075, 0.15],
  [-0.075, 0.15],
  [0.075, -0.15],
  [-0.075, -0.15],
]

function Leg({ index }: { index: number }) {
  const [x, z] = LEGS[index]
  return (
    <group
      name={`dog-leg-${index}`}
      position={[x, HIP_Y, z - REAR_Z]}
    >
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.034, 0.03, 0.24, 7]} />
        <meshStandardMaterial color={DOG_COLORS.coat} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.255, 0.012]} scale={[1, 0.75, 1.25]}>
        <sphereGeometry args={[0.036, 10, 8]} />
        <meshStandardMaterial color={DOG_COLORS.cream} roughness={0.9} />
      </mesh>
    </group>
  )
}

function Ear({ side }: { side: 1 | -1 }) {
  return (
    <group position={[side * 0.068, 0.07, -0.015]} rotation={[0.15, 0, side * -0.45]}>
      <mesh position={[0, 0.045, 0]}>
        <coneGeometry args={[0.045, 0.1, 4]} />
        <meshStandardMaterial color={DOG_COLORS.dark} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.088, 0.018]} rotation-x={1.1}>
        <coneGeometry args={[0.02, 0.05, 4]} />
        <meshStandardMaterial color={DOG_COLORS.dark} roughness={0.9} />
      </mesh>
    </group>
  )
}

function Head() {
  return (
    <group
      name="dog-head"
      position={[0, 0.5, 0.27 - REAR_Z]}
    >
      <mesh castShadow scale={[1, 0.92, 1.05]}>
        <sphereGeometry args={[0.115, 14, 10]} />
        <meshStandardMaterial color={DOG_COLORS.coat} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.035, 0.1]} rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.05, 0.06, 4, 10]} />
        <meshStandardMaterial color={DOG_COLORS.cream} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.012, 0.17]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshStandardMaterial color={DOG_COLORS.nose} roughness={0.3} />
      </mesh>
      <group
        name="dog-eyes"
      >
        {[1, -1].map(side => (
          <mesh key={side} position={[side * 0.045, 0.025, 0.088]}>
            <sphereGeometry args={[0.016, 8, 6]} />
            <meshStandardMaterial color={DOG_COLORS.nose} roughness={0.2} />
          </mesh>
        ))}
      </group>
      <group
        name="dog-tongue"
        position={[0, -0.075, 0.13]}
        visible={false}
      >
        <mesh rotation-x={0.4}>
          <boxGeometry args={[0.035, 0.008, 0.05]} />
          <meshStandardMaterial color={DOG_COLORS.tongue} roughness={0.5} />
        </mesh>
      </group>
      <Ear side={1} />
      <Ear side={-1} />
    </group>
  )
}

function Tail() {
  return (
    <group
      name="dog-tail"
      position={[0, 0.42, -0.2 - REAR_Z]}
    >
      <mesh position={[0, 0.06, -0.06]} rotation-x={-0.9}>
        <cylinderGeometry args={[0.026, 0.036, 0.16, 7]} />
        <meshStandardMaterial color={DOG_COLORS.coat} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.15, -0.09]} rotation-x={-0.2}>
        <cylinderGeometry args={[0.02, 0.026, 0.1, 7]} />
        <meshStandardMaterial color={DOG_COLORS.coat} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.205, -0.075]}>
        <sphereGeometry args={[0.026, 8, 6]} />
        <meshStandardMaterial color={DOG_COLORS.cream} roughness={0.85} />
      </mesh>
    </group>
  )
}

type DogModelProps = { onClick: (event: ThreeEvent<MouseEvent>) => void; onHover: (hovered: boolean) => void }

// A caramel mutt made of primitives; the body pivots at the rear hips so it can sit and lie down.
export function DogModel({ onClick, onHover }: DogModelProps) {
  return (
    <group
      onClick={onClick}
      onPointerOver={event => {
        event.stopPropagation()
        onHover(true)
      }}
      onPointerOut={() => onHover(false)}
    >
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.9]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group
        name="dog-body"
        position={[0, 0, REAR_Z]}
      >
        <mesh position={[0, 0.36, -REAR_Z]} rotation-x={Math.PI / 2} castShadow>
          <capsuleGeometry args={[0.12, 0.32, 4, 12]} />
          <meshStandardMaterial color={DOG_COLORS.coat} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.32, 0.16 - REAR_Z]} scale={[0.9, 1, 0.8]}>
          <sphereGeometry args={[0.1, 12, 8]} />
          <meshStandardMaterial color={DOG_COLORS.cream} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.43, 0.2 - REAR_Z]} rotation-x={-0.6}>
          <cylinderGeometry args={[0.07, 0.09, 0.16, 10]} />
          <meshStandardMaterial color={DOG_COLORS.coat} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.455, 0.235 - REAR_Z]} rotation-x={Math.PI / 2 - 0.6}>
          <torusGeometry args={[0.075, 0.016, 6, 16]} />
          <meshStandardMaterial color="#c1121f" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.39, 0.29 - REAR_Z]}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshStandardMaterial color="#f2c230" metalness={0.6} roughness={0.3} />
        </mesh>
        <Head />
        <Tail />
        {LEGS.map((_, i) => (
          <Leg key={i} index={i} />
        ))}
      </group>
    </group>
  )
}
