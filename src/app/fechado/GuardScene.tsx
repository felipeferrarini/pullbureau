'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { CharacterModel, PlaceholderBody } from '@/scene/CharacterModel'
import { SafeBoundary } from '@/scene/SafeBoundary'
import { PERSON_MODEL_IDS } from '@/shared/characters'

export function GuardScene() {
  return (
    <Canvas camera={{ position: [0, 1.1, 4.2], fov: 40 }} onCreated={({ camera }) => camera.lookAt(0, 1.1, 0)}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />
      <SafeBoundary fallback={<PlaceholderBody />}>
        <Suspense fallback={<PlaceholderBody />}>
          <CharacterModel modelId={PERSON_MODEL_IDS[0] ?? 'none'} anim="no" />
        </Suspense>
      </SafeBoundary>
    </Canvas>
  )
}
