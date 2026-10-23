'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import type { DuelFrame, DuelPhase, DuelScript } from '@/types/duel'
import type { Vec3 } from '@/types/scene'
import { FIGHT_X, sideSign } from './fighterPose'

type Shot = { position: Vec3; target: Vec3; ease: number }

const VS_SHOT: Shot = { position: [0, 1.3, 4.1], target: [0, 1.12, 0], ease: 6 }
const FIGHT_SHOT: Shot = { position: [0, 1.75, 6.3], target: [0, 1.05, 0], ease: 2.5 }
const FINISH_SHOT: Shot = { position: [0, 1.45, 4.7], target: [0, 1.15, 0], ease: 1.6 }

function shotFor(script: DuelScript, frame: DuelFrame): Shot {
  if (frame.phase === 'vs') return VS_SHOT
  if (frame.phase === 'finish' || (frame.phase === 'fight' && frame.slow)) return FINISH_SHOT
  if (frame.phase === 'outcome' || frame.phase === 'done') {
    if (frame.frozen) return { ...FINISH_SHOT, ease: 0 }
    const winner = script.outcome.winner
    const loser = winner ? script.fighters.find(f => f !== winner) : null
    const x = loser ? sideSign(script, loser) * FIGHT_X * 0.35 : 0
    const high = script.outcome.kind === 'approved'
    return { position: [x, high ? 2.7 : 2.0, high ? 6.4 : 5.4], target: [x, high ? 1.1 : 0.8, 0], ease: 1.4 }
  }
  if (frame.phase === 'fight') {
    const attacker = script.moves[frame.moveIndex]?.attacker
    const drift = attacker ? sideSign(script, attacker) * 0.22 : 0
    return { ...FIGHT_SHOT, position: [drift, FIGHT_SHOT.position[1], FIGHT_SHOT.position[2]], target: [drift * 0.6, FIGHT_SHOT.target[1], 0] }
  }
  return FIGHT_SHOT
}

export function ArenaCamera({ script, frame, reduced }: { script: DuelScript; frame: DuelFrame; reduced: boolean }) {
  const camera = useThree(state => state.camera)
  const look = useMemo(() => new Vector3(...FIGHT_SHOT.target), [])
  const goal = useMemo(() => new Vector3(), [])
  const goalLook = useMemo(() => new Vector3(), [])
  const lastPhase = useRef<DuelPhase>('vs')
  const shot = shotFor(script, frame)
  const phase = frame.phase

  useFrame((_, delta) => {
    const cut = lastPhase.current === 'vs' && phase !== 'vs'
    lastPhase.current = phase
    goal.set(...shot.position)
    goalLook.set(...shot.target)
    const k = reduced || cut || shot.ease === 0 ? 1 : 1 - Math.exp(-shot.ease * delta)
    if (shot.ease === 0) return
    camera.position.lerp(goal, k)
    look.lerp(goalLook, k)
    camera.lookAt(look)
  })
  return null
}
