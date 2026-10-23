'use client'

const CONCRETE = '#dfe4e6'
const GLASS = '#7f95a3'
const ORIGIN: [number, number, number] = [1, -0.6, -150]

function Congresso() {
  return (
    <group>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[150, 8, 44]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.9} />
      </mesh>
      {[-7, 7].map(x => (
        <mesh key={x} position={[x, 8 + 29, -6]}>
          <boxGeometry args={[11, 58, 20]} />
          <meshStandardMaterial color={GLASS} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 8 + 38, -6]}>
        <boxGeometry args={[3, 6, 16]} />
        <meshStandardMaterial color={GLASS} roughness={0.6} />
      </mesh>
      <mesh position={[-36, 8, 4]}>
        <sphereGeometry args={[17, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.9} />
      </mesh>
      <mesh position={[38, 8 + 13, 4]} rotation-x={Math.PI}>
        <sphereGeometry args={[26, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.9} />
      </mesh>
    </group>
  )
}

// Far behind the block, through the haze and the gap between the neighbours: the Congresso towers and domes.
export function Skyline() {
  return (
    <group position={ORIGIN}>
      <Congresso />
    </group>
  )
}
