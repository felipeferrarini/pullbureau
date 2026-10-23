import type { CiState, PrThread } from './domain'
import type { StampVariant } from './scene'

export type AgeLevel = 'fresh' | 'warm' | 'hot' | 'fossil'
export type AgeBadge = { level: AgeLevel; label: string }

export type TimelineItem =
  | { kind: 'opened'; at: string; author: string }
  | { kind: 'review'; at: string; reviewer: string; stamp: StampVariant; label: string }
  | { kind: 'comment'; at: string; author: string; excerpt: string }
  | { kind: 'ci'; state: CiState; label: string }

export type ThreadLoad = { status: 'loading' } | { status: 'failed' } | { status: 'ready'; thread: PrThread | null }
