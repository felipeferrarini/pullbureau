'use client'

import { avatarImageUrl } from '@/shared/avatar'
import { useTexture } from '@react-three/drei'
import { Suspense } from 'react'
import { SRGBColorSpace } from 'three'
import { SafeBoundary } from './SafeBoundary'

const CARD: [number, number] = [0.16, 0.21]
const PHOTO = 0.12

export const avatarTextureUrl = avatarImageUrl

function Photo({ login }: { login: string }) {
  const texture = useTexture(avatarTextureUrl(login), loaded => {
    const single = Array.isArray(loaded) ? loaded[0] : loaded
    single.colorSpace = SRGBColorSpace
  })
  return (
    <mesh position={[0, -0.012, 0.002]}>
      <planeGeometry args={[PHOTO, PHOTO]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function Lanyard() {
  return (
    <>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * 0.07, CARD[1] / 2 + 0.09, -0.01]} rotation-z={side * 0.42}>
          <planeGeometry args={[0.025, 0.22]} />
          <meshStandardMaterial color="#1f4d3a" roughness={0.8} />
        </mesh>
      ))}
    </>
  )
}

export function Badge({ login, accent = '#2d6a4f' }: { login: string; accent?: string }) {
  return (
    <group>
      <Lanyard />
      <mesh>
        <planeGeometry args={CARD} />
        <meshStandardMaterial color="#fbfaf5" roughness={0.4} />
      </mesh>
      <mesh position={[0, CARD[1] / 2 - 0.012, 0.001]}>
        <planeGeometry args={[CARD[0], 0.024]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <SafeBoundary fallback={null}>
        <Suspense fallback={null}>
          <Photo login={login} />
        </Suspense>
      </SafeBoundary>
    </group>
  )
}
