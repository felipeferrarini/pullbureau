import type { PrRef } from './domain'

export type DuelMove = { attacker: string; defender: string; excerpt: string; damage: number; isCounter: boolean; finishHim: boolean }
export type DuelOutcomeKind = 'approved' | 'closed' | 'to_be_continued'
export type DuelOutcome = { kind: DuelOutcomeKind; winner: string | null }
export type DuelScript = { pr: PrRef; fighters: [string, string]; moves: DuelMove[]; outcome: DuelOutcome }
export type DuelPhase = 'vs' | 'round' | 'go' | 'finish' | 'fight' | 'outcome' | 'done'
export type DuelSegment = { phase: DuelPhase; start: number; end: number; moveIndex: number; impact: number | null; slow: boolean }
export type DuelFrame = {
  phase: DuelPhase
  moveIndex: number
  hp: Record<string, number>
  caption: string
  segmentElapsed: number
  slow: boolean
  impactAge: number | null
  combo: number
  timer: number
  frozen: boolean
}
