'use client'

import { Text } from '@react-three/drei'
import type { Vec3 } from '@/types/scene'
import { FONT_URL } from '../fonts'

// A worn-out cushion and a steel bowl with his name, by the entrance.
export function DogBed({ position }: { position: Vec3 }) {
  return (
    <group position={position} rotation-y={0.35}>
      <mesh position={[0, 0.06, 0]} scale={[1, 0.35, 0.78]} receiveShadow castShadow>
        <torusGeometry args={[0.34, 0.13, 8, 20]} />
        <meshStandardMaterial color="#6f8fb3" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation-x={-Math.PI / 2} scale={[1, 0.78, 1]} receiveShadow>
        <circleGeometry args={[0.32, 20]} />
        <meshStandardMaterial color="#d8c7a6" roughness={1} />
      </mesh>
      <group position={[0.62, 0, 0.18]}>
        <mesh position={[0, 0.045, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.1, 0.09, 16, 1, true]} />
          <meshStandardMaterial color="#c9ced3" metalness={0.8} roughness={0.3} side={2} />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.115, 16]} />
          <meshStandardMaterial color="#7fb3d5" roughness={0.1} />
        </mesh>
      </group>
      <Text font={FONT_URL} position={[0, 0.012, 0.46]} rotation-x={-Math.PI / 2} fontSize={0.1} color="#6b4f2e" anchorX="center">
        CARAMELO
      </Text>
    </group>
  )
}
