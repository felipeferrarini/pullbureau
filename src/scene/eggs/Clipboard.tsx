'use client'

// The inspector's prancheta, held in the right fist.
export function Clipboard() {
  return (
    <group position={[0, 0.02, 0.1]} rotation={[-0.5, 0, 0.1]} scale={1.35}>
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.28, 0.012]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.01, 0.008]}>
        <planeGeometry args={[0.17, 0.22]} />
        <meshStandardMaterial color="#fdfcf7" roughness={0.9} />
      </mesh>
      {[0.05, 0.01, -0.03, -0.07].map(y => (
        <mesh key={y} position={[0, y, 0.009]}>
          <planeGeometry args={[0.12, 0.008]} />
          <meshStandardMaterial color="#5a6b8c" />
        </mesh>
      ))}
      <mesh position={[0, 0.125, 0.012]}>
        <boxGeometry args={[0.08, 0.03, 0.015]} />
        <meshStandardMaterial color="#b8bcc2" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}
