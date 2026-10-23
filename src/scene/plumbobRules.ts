import type { CiState } from '@/types/domain'
import type { PlumbobStyle } from '@/types/scene'

const TICKET_DIGITS = 4

export const PLUMBOB_STYLE: Record<CiState, PlumbobStyle> = {
  success: { color: '#36d27a', glow: 1.6, pulse: false },
  failure: { color: '#ff3b3b', glow: 2.6, pulse: false },
  pending: { color: '#ffb020', glow: 2.4, pulse: true },
  none: { color: '#a3a8ad', glow: 0.25, pulse: false },
}

export const ticketCode = (number: number) => String(number % 10 ** TICKET_DIGITS).padStart(TICKET_DIGITS, '0')

export const plumbobLabel = (pr: { number: number; ageDays: number }) => `senha ${ticketCode(pr.number)} · ${Math.max(0, Math.floor(pr.ageDays))}d`
