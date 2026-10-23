import { t } from '@/i18n'
import type { DuelFrame, DuelOutcomeKind, DuelPhase, DuelScript, DuelSegment } from '@/types/duel'
import type { LogicalAnim } from '@/types/scene'

export const VS_MS = 3400
export const ROUND_MS = 1300
export const GO_MS = 900
export const MOVE_MS = 1500
export const IMPACT_MS = 430
export const PUNCH_MS = 900
export const HIT_REACT_MS = 650
export const FINISH_MS = 1500
export const SLOW_MO = 0.4
export const FINAL_MOVE_MS = MOVE_MS / SLOW_MO
export const FINAL_IMPACT_MS = IMPACT_MS / SLOW_MO
export const FREEZE_BEFORE_MS = 120
export const FINISHER_MS = 5600
export const TBC_MS = 4800
export const HIT_STOP_MS = 80
export const START_HP = 100
export const START_TIMER = 99

export const OUTCOME_TITLES: Record<DuelOutcomeKind, string> = {
  approved: t('ui.approvedLabel'),
  closed: t('ui.closedLabel'),
  to_be_continued: t('ui.toBeContinuedCaption'),
}

// The finishing blow (or the last move when nobody is ahead) is saved for the end.
export function finalMoveIndex(script: DuelScript): number {
  const finishing = script.moves.findIndex(move => move.finishHim)
  return finishing >= 0 ? finishing : script.moves.length - 1
}

export function playOrder(script: DuelScript): number[] {
  const final = finalMoveIndex(script)
  const rest = script.moves.map((_, i) => i).filter(i => i !== final)
  return final >= 0 ? [...rest, final] : rest
}

const isFrozenEnding = (script: DuelScript) => script.outcome.kind === 'to_be_continued'

export function duelSegments(script: DuelScript): DuelSegment[] {
  const segments: DuelSegment[] = []
  let cursor = 0
  const push = (phase: DuelPhase, length: number, moveIndex = -1, impact: number | null = null, slow = false) => {
    segments.push({ phase, start: cursor, end: cursor + length, moveIndex, impact: impact === null ? null : cursor + impact, slow })
    cursor += length
  }
  push('vs', VS_MS)
  push('round', ROUND_MS)
  push('go', GO_MS)
  const final = finalMoveIndex(script)
  for (const i of playOrder(script)) {
    if (i !== final) {
      push('fight', MOVE_MS, i, IMPACT_MS)
      continue
    }
    if (script.moves[i].finishHim) push('finish', FINISH_MS, i)
    if (isFrozenEnding(script)) push('fight', FINAL_IMPACT_MS - FREEZE_BEFORE_MS, i, null, true)
    else push('fight', FINAL_MOVE_MS, i, FINAL_IMPACT_MS, true)
  }
  push('outcome', isFrozenEnding(script) ? TBC_MS : FINISHER_MS, final)
  return segments
}

export const duelDuration = (script: DuelScript) => duelSegments(script).at(-1)?.end ?? 0

export const impactTimes = (script: DuelScript) => duelSegments(script).flatMap(segment => (segment.impact === null ? [] : [segment.impact]))

function captionFor(script: DuelScript, segment: DuelSegment): string {
  switch (segment.phase) {
    case 'vs':
      return `${script.fighters[0]} VS ${script.fighters[1]}`
    case 'round':
      return t('ui.round1')
    case 'go':
      return t('ui.go')
    case 'finish':
      return t('ui.finish')
    case 'fight':
      return script.moves[segment.moveIndex].excerpt
    default:
      return OUTCOME_TITLES[script.outcome.kind]
  }
}

export function comboAt(script: DuelScript, moveIndex: number): number {
  const order = playOrder(script)
  const position = order.indexOf(moveIndex)
  if (position < 0) return 0
  const attacker = script.moves[moveIndex].attacker
  let combo = 1
  for (let k = position - 1; k >= 0 && script.moves[order[k]].attacker === attacker; k--) combo++
  return combo
}

const DONE: Omit<DuelSegment, 'start' | 'moveIndex'> = { phase: 'done', end: Number.POSITIVE_INFINITY, impact: null, slow: false }

function segmentAt(script: DuelScript, segments: DuelSegment[], elapsed: number): DuelSegment {
  const found = segments.find(s => elapsed >= s.start && elapsed < s.end)
  return found ?? { ...DONE, start: duelDuration(script), moveIndex: finalMoveIndex(script) }
}

function fightTimer(segments: DuelSegment[], elapsed: number): number {
  const start = segments.find(s => s.phase === 'fight')?.start ?? 0
  const end = segments.find(s => s.phase === 'outcome')?.start ?? start
  const clamped = Math.min(Math.max(elapsed, start), end)
  return Math.max(0, START_TIMER - Math.floor((clamped - start) / 1000))
}

export function duelFrameAt(script: DuelScript, elapsed: number): DuelFrame {
  const segments = duelSegments(script)
  const segment = segmentAt(script, segments, elapsed)
  const landedAt = new Map(segments.flatMap(s => (s.impact !== null && s.impact <= elapsed ? [[s.moveIndex, s.impact] as const] : [])))
  const hp: Record<string, number> = Object.fromEntries(script.fighters.map(login => [login, START_HP]))
  script.moves.forEach((move, i) => {
    if (landedAt.has(i)) hp[move.defender] = Math.max(0, hp[move.defender] - move.damage)
  })
  const impact = segment.phase === 'fight' && segment.impact !== null && elapsed >= segment.impact ? elapsed - segment.impact : null
  const frozen = isFrozenEnding(script) && (segment.phase === 'outcome' || segment.phase === 'done')
  return {
    phase: segment.phase,
    moveIndex: segment.moveIndex,
    hp,
    caption: captionFor(script, segment),
    segmentElapsed: elapsed - segment.start,
    slow: segment.slow,
    impactAge: impact,
    combo: segment.phase === 'fight' ? comboAt(script, segment.moveIndex) : 0,
    timer: fightTimer(segments, elapsed),
    frozen,
  }
}

function moveAnim(script: DuelScript, frame: DuelFrame, login: string): LogicalAnim {
  const move = script.moves[frame.moveIndex]
  const scale = frame.slow ? 1 / SLOW_MO : 1
  if (move.attacker === login) return frame.segmentElapsed < PUNCH_MS * scale ? 'punch' : 'idle'
  if (move.defender === login && frame.impactAge !== null && frame.impactAge < HIT_REACT_MS * scale) return 'hit'
  return 'idle'
}

export function fighterAnim(script: DuelScript, frame: DuelFrame, login: string): LogicalAnim {
  if (frame.phase === 'fight') return moveAnim(script, frame, login)
  if (frame.phase !== 'outcome' && frame.phase !== 'done') return 'idle'
  if (frame.frozen) return script.moves[frame.moveIndex]?.attacker === login ? 'punch' : 'idle'
  if (!script.outcome.winner) return 'idle'
  return script.outcome.winner === login ? 'victory' : 'death'
}

export function animSpeed(frame: DuelFrame): number {
  if (frame.frozen) return 0
  return frame.slow ? SLOW_MO : 1
}
