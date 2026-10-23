'use client'

import { Suspense } from 'react'
import { CharacterModel } from '@/scene/CharacterModel'
import { SafeBoundary } from '@/scene/SafeBoundary'
import type { DuelPhase } from '@/types/duel'
import type { LogicalAnim, Vec3 } from '@/types/scene'

const SPOTS: Vec3[] = [
  [3.35, 0, -0.95],
  [3.25, 0, 0.35],
  [3.4, 0, 1.55],
  [4.4, 0.32, -0.35],
  [4.45, 0.32, 0.95],
]
const CHEERS: LogicalAnim[] = ['victory', 'jump', 'yes', 'victory', 'jump']
const FILLERS = Array.from({ length: 10 }, (_, i) => `servidor-${i + 1}`)

function animFor(phase: DuelPhase, i: number): LogicalAnim {
  if (phase === 'vs') return 'idle'
  if (phase === 'finish') return i % 2 ? 'idle' : 'yes'
  if (phase === 'outcome' || phase === 'done') return i % 2 ? 'jump' : 'victory'
  return CHEERS[i % CHEERS.length]
}

function Riser({ side }: { side: number }) {
  return (
    <mesh position={[side * 4.45, 0.15, 0.3]} castShadow receiveShadow>
      <boxGeometry args={[1.1, 0.3, 2.6]} />
      <meshStandardMaterial color="#6b4a2f" roughness={0.8} />
    </mesh>
  )
}

type Props = { fighters: [string, string]; crowd: string[]; perSide: number; modelFor: (login: string) => string; phase: DuelPhase; frozen: boolean }

export function ArenaCrowd({ fighters, crowd, perSide, modelFor, phase, frozen }: Props) {
  const logins = [...crowd.filter(login => !fighters.includes(login)), ...FILLERS].slice(0, perSide * 2)
  return (
    <>
      <Riser side={-1} />
      <Riser side={1} />
      {logins.map((login, i) => {
        const side = i < perSide ? -1 : 1
        const [x, y, z] = SPOTS[i % perSide]
        return (
          <group key={login} position={[side * x, y, z]} rotation-y={-side * (Math.PI / 2 - 0.25)}>
            <SafeBoundary fallback={null}>
              <Suspense fallback={null}>
                <CharacterModel modelId={modelFor(login)} anim={animFor(phase, i)} login={login} seed={`crowd:${login}`} timeScale={frozen ? 0 : 1} />
              </Suspense>
            </SafeBoundary>
          </group>
        )
      })}
    </>
  )
}
