'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { CharacterModel, PlaceholderBody } from '@/scene/CharacterModel'
import { useLiteScene, usePixelRatio } from '@/scene/render/quality'
import { useReducedMotion } from '@/scene/render/useReducedMotion'
import { SafeBoundary } from '@/scene/SafeBoundary'
import type { Counter } from '@/types/domain'
import type { DuelFrame, DuelScript } from '@/types/duel'
import { animSpeed, fighterAnim } from '../timeline'
import { ArenaCamera } from './ArenaCamera'
import { ArenaCrowd } from './ArenaCrowd'
import { ArenaFx } from './ArenaFx'
import { ArenaSet } from './ArenaSet'
import { FinisherFx } from './FinisherFx'
import { fighterPose, sideSign } from './fighterPose'
import { ImpactSparks } from './ImpactSparks'

type FighterProps = { script: DuelScript; frame: DuelFrame; login: string; modelId: string; hitStop: boolean }

function Fighter({ script, frame, login, modelId, hitStop }: FighterProps) {
  const pose = fighterPose(script, frame, login)
  const speed = hitStop ? 0 : animSpeed(frame)
  return (
    <group position={[pose.x, pose.y, 0]} rotation-y={pose.facing} scale={[1 + (1 - pose.squash) * 0.35, pose.squash, 1 + (1 - pose.squash) * 0.35]}>
      <SafeBoundary fallback={<PlaceholderBody />}>
        <Suspense fallback={<PlaceholderBody />}>
          <CharacterModel modelId={modelId} anim={fighterAnim(script, frame, login)} login={login} seed={`duel:${login}`} timeScale={speed} />
        </Suspense>
      </SafeBoundary>
    </group>
  )
}

function Sparks({ script, frame }: { script: DuelScript; frame: DuelFrame }) {
  if (frame.phase !== 'fight' || frame.impactAge === null) return null
  const move = script.moves[frame.moveIndex]
  const side = sideSign(script, move.defender)
  return <ImpactSparks key={frame.moveIndex} position={[side * 0.72, 1.28, 0.15]} direction={side} power={frame.slow ? 2 : Math.min(1.6, 0.6 + move.damage / 30)} />
}

type Props = { script: DuelScript; frame: DuelFrame; hitStop: boolean; modelFor: (login: string) => string; crowd: string[]; counter: Counter | null }

export function DuelArena({ script, frame, hitStop, modelFor, crowd, counter }: Props) {
  const reduced = useReducedMotion()
  const low = useLiteScene()
  const dpr = usePixelRatio()
  const [left, right] = script.fighters
  return (
    <Canvas shadows={!low} dpr={dpr} camera={{ position: [0, 1.35, 4.2], fov: 38, near: 0.1, far: 80 }}>
      <Suspense fallback={null}>
        <ArenaSet counter={counter} low={low} />
        <ArenaCrowd fighters={script.fighters} crowd={crowd} perSide={low ? 2 : 5} modelFor={modelFor} phase={frame.phase} frozen={frame.frozen} />
        <FinisherFx script={script} frame={frame} reduced={reduced} />
      </Suspense>
      <Fighter script={script} frame={frame} login={left} modelId={modelFor(left)} hitStop={hitStop} />
      <Fighter script={script} frame={frame} login={right} modelId={modelFor(right)} hitStop={hitStop} />
      <Sparks script={script} frame={frame} />
      <ArenaCamera script={script} frame={frame} reduced={reduced} />
      <ArenaFx low={low} />
    </Canvas>
  )
}
