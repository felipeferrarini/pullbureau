import type { DuelFrame, DuelScript } from '@/types/duel'
import { IMPACT_MS, SLOW_MO } from '../timeline'

export const FIGHT_X = 1.05
export const VS_X = 0.95
const LUNGE = 0.68
const KNOCKBACK = 0.34
const RECOVER_MS = 420
export const STAMP_HIT_MS = 650
export const TRAPDOOR_DROP_MS = 520

export type FighterPose = { x: number; y: number; squash: number; facing: number }

const easeOut = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

export const sideSign = (script: DuelScript, login: string) => (login === script.fighters[0] ? -1 : 1)

function fightOffset(script: DuelScript, frame: DuelFrame, login: string): number {
  const move = script.moves[frame.moveIndex]
  if (!move) return 0
  const scale = frame.slow ? 1 / SLOW_MO : 1
  const impactAt = IMPACT_MS * scale
  const toward = -sideSign(script, login)
  if (move.attacker === login) {
    const t = frame.segmentElapsed < impactAt ? easeOut(clamp01(frame.segmentElapsed / impactAt)) : 1 - clamp01((frame.segmentElapsed - impactAt) / (RECOVER_MS * scale))
    return toward * LUNGE * t
  }
  if (move.defender === login && frame.impactAge !== null) {
    const push = KNOCKBACK * (0.6 + Math.min(1, move.damage / 40))
    return -toward * push * Math.exp(-frame.impactAge / (RECOVER_MS * scale))
  }
  return 0
}

function finaleOffset(script: DuelScript, frame: DuelFrame, login: string): Partial<FighterPose> {
  const winner = script.outcome.winner
  const loser = winner ? script.fighters.find(f => f !== winner) : null
  if (frame.frozen) return {}
  if (login === winner) return { facing: sideSign(script, login) * -0.45 }
  if (login !== loser) return {}
  const t = frame.phase === 'done' ? Number.POSITIVE_INFINITY : frame.segmentElapsed
  if (script.outcome.kind === 'approved') return { squash: t >= STAMP_HIT_MS ? 0.32 : 1 }
  if (script.outcome.kind === 'closed') {
    const fall = Math.max(0, t - TRAPDOOR_DROP_MS) / 1000
    return { y: -Math.min(4, 9 * fall * fall) }
  }
  return {}
}

export function fighterPose(script: DuelScript, frame: DuelFrame, login: string): FighterPose {
  const side = sideSign(script, login)
  if (frame.phase === 'vs') return { x: side * VS_X, y: 0, squash: 1, facing: -side * 0.35 }
  const base: FighterPose = { x: side * FIGHT_X, y: 0, squash: 1, facing: (-side * Math.PI) / 2 }
  if (frame.phase === 'fight') return { ...base, x: base.x + fightOffset(script, frame, login) }
  if (frame.phase === 'outcome' || frame.phase === 'done') {
    const frozenX = frame.frozen ? fightOffset(script, { ...frame, phase: 'fight', segmentElapsed: IMPACT_MS / SLOW_MO, impactAge: null, slow: true }, login) : 0
    return { ...base, x: base.x + frozenX, ...finaleOffset(script, frame, login) }
  }
  return base
}
