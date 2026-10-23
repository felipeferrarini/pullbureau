import { describe, expect, it } from 'vitest'
import type { DuelScript } from '@/types/duel'
import { GO_MS, IMPACT_MS, ROUND_MS, VS_MS, duelDuration, duelFrameAt } from '../timeline'
import { FIGHT_X, STAMP_HIT_MS, TRAPDOOR_DROP_MS, VS_X, fighterPose } from './fighterPose'

const move = (attacker: string, finishHim = false) => ({ attacker, defender: attacker === 'a' ? 'b' : 'a', excerpt: 'x', damage: 30, isCounter: false, finishHim })
const base: DuelScript = {
  pr: { repo: 'r', number: 1, title: 't', url: 'u', author: 'a' },
  fighters: ['a', 'b'],
  outcome: { kind: 'approved', winner: 'a' },
  moves: [move('b'), move('a', true)],
}
const fightStart = VS_MS + ROUND_MS + GO_MS
const outcomeStart = (script: DuelScript) => duelDuration(script) - 5600

describe('fighterPose', () => {
  it('faces the camera on the VS screen and each other in the fight', () => {
    expect(fighterPose(base, duelFrameAt(base, 0), 'a')).toMatchObject({ x: -VS_X, y: 0 })
    const round = fighterPose(base, duelFrameAt(base, VS_MS), 'b')
    expect(round.x).toBe(FIGHT_X)
    expect(round.facing).toBeCloseTo(-Math.PI / 2)
  })

  it('lunges the attacker in and knocks the defender back at the impact', () => {
    const impact = duelFrameAt(base, fightStart + IMPACT_MS + 1)
    expect(fighterPose(base, impact, 'b').x).toBeLessThan(FIGHT_X - 0.5)
    expect(fighterPose(base, impact, 'a').x).toBeLessThan(-FIGHT_X)
  })

  it('flattens the loser under the APPROVALITY stamp', () => {
    const frame = duelFrameAt(base, outcomeStart(base) + STAMP_HIT_MS + 10)
    expect(fighterPose(base, frame, 'b').squash).toBeLessThan(0.5)
    expect(fighterPose(base, frame, 'a')).toMatchObject({ squash: 1, facing: 0.45 })
  })

  it('drops the loser through the CLOSEDALITY trapdoor', () => {
    const closed: DuelScript = { ...base, outcome: { kind: 'closed', winner: 'a' } }
    const frame = duelFrameAt(closed, outcomeStart(closed) + TRAPDOOR_DROP_MS + 600)
    expect(fighterPose(closed, frame, 'b').y).toBeLessThan(-1)
    expect(fighterPose(closed, frame, 'a').y).toBe(0)
  })
})
