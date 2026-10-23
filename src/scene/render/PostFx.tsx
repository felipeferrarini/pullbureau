'use client'

import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useQualityProfile } from './quality'

export function PostFx() {
  const { ao, bloom, multisampling } = useQualityProfile()
  return (
    <EffectComposer multisampling={multisampling} enableNormalPass={false}>
      {ao ? <N8AO halfRes aoRadius={1.4} distanceFalloff={0.7} intensity={3} aoSamples={12} denoiseSamples={4} color="#2a2018" /> : <></>}
      {bloom ? <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.15} intensity={1.1} radius={0.55} /> : <></>}
      <Vignette offset={0.32} darkness={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
