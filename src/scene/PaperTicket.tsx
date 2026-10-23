'use client'

import { DoubleSide } from 'three'

const PAPER: [number, number] = [0.06, 0.09]

export function PaperTicket() {
  return (
    <group position={[0, 0.06, 0.02]} rotation={[0, 0, 0]}>
      <mesh>
        <planeGeometry args={PAPER} />
        <meshStandardMaterial color="#fffdf2" side={DoubleSide} roughness={0.9} />
      </mesh>
      <mesh position={[0, PAPER[1] / 2 - 0.012, 0.001]}>
        <planeGeometry args={[PAPER[0], 0.014]} />
        <meshStandardMaterial color="#d62828" side={DoubleSide} />
      </mesh>
    </group>
  )
}
