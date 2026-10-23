import { t } from '@/i18n'
import { describe, expect, it } from 'vitest'
import type { DuelScript } from '@/types/duel'
import {
  FINISHER_MS,
  FINAL_IMPACT_MS,
  FINAL_MOVE_MS,
  FINISH_MS,
  FREEZE_BEFORE_MS,
  GO_MS,
  IMPACT_MS,
  MOVE_MS,
  ROUND_MS,
  START_TIMER,
  TBC_MS,
  VS_MS,
  animSpeed,
  comboAt,
  fighterAnim,
  impactTimes,
  duelSegments,
  duelDuration,
  duelFrameAt,
  playOrder,
} from './timeline'

const pr = { repo: 'api', number: 412, title: 't', url: 'u', author: 'felipe' }
const move = (attacker: string, damage: number, finishHim = false) => ({
  attacker,
  defender: attacker === 'felipe' ? 'henry' : 'felipe',
  excerpt: `${attacker} ${damage}`,
  damage,
  isCounter: false,
  finishHim,
})

// henry lands the finishing blow at index 2, but felipe still talks after it.
const script: DuelScript = {
  pr,
  fighters: ['felipe', 'henry'],
  outcome: { kind: 'closed', winner: 'henry' },
  moves: [move('henry', 40), move('felipe', 30), move('henry', 60, true), move('felipe', 30)],
}
const fightStart = VS_MS + ROUND_MS + GO_MS

describe('duel timeline', () => {
  it('saves the finishing blow for last', () => {
    expect(playOrder(script)).toEqual([0, 1, 3, 2])
  })

  it('runs vs, round 1, fight, the moves, finish, a slow-mo blow and the finisher', () => {
    expect(duelDuration(script)).toBe(fightStart + 3 * MOVE_MS + FINISH_MS + FINAL_MOVE_MS + FINISHER_MS)
    expect(duelFrameAt(script, 0)).toMatchObject({ phase: 'vs', caption: 'felipe VS henry' })
    expect(duelFrameAt(script, VS_MS).caption).toBe(t('ui.round1'))
    expect(duelFrameAt(script, VS_MS + ROUND_MS).caption).toBe(t('ui.go'))
    expect(duelFrameAt(script, fightStart + 3 * MOVE_MS)).toMatchObject({ phase: 'finish', caption: t('ui.finish') })
    expect(duelFrameAt(script, fightStart + 3 * MOVE_MS + FINISH_MS)).toMatchObject({ phase: 'fight', moveIndex: 2, slow: true })
    expect(duelFrameAt(script, duelDuration(script) - 1)).toMatchObject({ phase: 'outcome', caption: t('ui.closedLabel') })
    expect(duelFrameAt(script, duelDuration(script) + 1).phase).toBe('done')
  })

  it('lands the damage at the impact and reports how long ago it hit', () => {
    expect(duelFrameAt(script, fightStart + IMPACT_MS - 1)).toMatchObject({ impactAge: null, hp: { felipe: 100 } })
    expect(duelFrameAt(script, fightStart + IMPACT_MS + 20)).toMatchObject({ impactAge: 20, hp: { felipe: 60 } })
    expect(impactTimes(script)[0]).toBe(fightStart + IMPACT_MS)
    expect(impactTimes(script)).toHaveLength(4)
  })

  it('knocks the loser to zero with the final blow', () => {
    const finalImpact = fightStart + 3 * MOVE_MS + FINISH_MS + FINAL_IMPACT_MS
    expect(duelFrameAt(script, finalImpact - 1).hp.felipe).toBe(60)
    expect(duelFrameAt(script, duelDuration(script) + 1).hp).toEqual({ felipe: 0, henry: 40 })
  })

  it('counts combos when the same person keeps talking', () => {
    const combo: DuelScript = { ...script, moves: [move('felipe', 10), move('felipe', 10), move('felipe', 10), move('henry', 10, true)] }
    expect([0, 1, 2].map(i => comboAt(combo, i))).toEqual([1, 2, 3])
    expect(duelFrameAt(combo, fightStart + 2 * MOVE_MS + 10).combo).toBe(3)
  })

  it('runs the timer down from 99 during the fight only', () => {
    expect(duelFrameAt(script, 0).timer).toBe(START_TIMER)
    expect(duelFrameAt(script, fightStart + 2500).timer).toBe(START_TIMER - 2)
    expect(duelFrameAt(script, duelDuration(script) + 99_000).timer).toBe(duelFrameAt(script, duelDuration(script) - 1).timer)
  })

  it('animates punches, hits and the result', () => {
    const first = duelFrameAt(script, fightStart + 100)
    expect(fighterAnim(script, first, 'henry')).toBe('punch')
    expect(fighterAnim(script, first, 'felipe')).toBe('idle')
    const hit = duelFrameAt(script, fightStart + IMPACT_MS + 50)
    expect(fighterAnim(script, hit, 'felipe')).toBe('hit')
    const end = duelFrameAt(script, duelDuration(script) - 1)
    expect(fighterAnim(script, end, 'henry')).toBe('victory')
    expect(fighterAnim(script, end, 'felipe')).toBe('death')
    expect(animSpeed(duelFrameAt(script, fightStart + 3 * MOVE_MS + FINISH_MS + 10))).toBeLessThan(1)
  })

  it('freezes right before the last blow when the pr is still open', () => {
    const open: DuelScript = { ...script, outcome: { kind: 'to_be_continued', winner: 'henry' } }
    const freezeAt = fightStart + 3 * MOVE_MS + FINISH_MS + FINAL_IMPACT_MS - FREEZE_BEFORE_MS
    expect(duelDuration(open)).toBe(freezeAt + TBC_MS)
    const frozen = duelFrameAt(open, freezeAt + 10)
    expect(frozen).toMatchObject({ phase: 'outcome', frozen: true, caption: t('ui.toBeContinuedCaption') })
    expect(frozen.hp.felipe).toBe(60)
    expect(animSpeed(frozen)).toBe(0)
    expect(fighterAnim(open, frozen, 'henry')).toBe('punch')
    expect(impactTimes(open)).toHaveLength(3)
  })

  it('leaves both standing when nobody is ahead', () => {
    const even: DuelScript = { ...script, outcome: { kind: 'to_be_continued', winner: null }, moves: script.moves.map(m => ({ ...m, finishHim: false })) }
    expect(playOrder(even)).toEqual([0, 1, 2, 3])
    expect(duelSegments(even).some(segment => segment.phase === 'finish')).toBe(false)
  })
})
