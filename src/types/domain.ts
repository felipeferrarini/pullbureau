export type PrRef = { repo: string; number: number; title: string; url: string; author: string }
export type PrKey = { repo: string; number: number }

export type CiState = 'success' | 'failure' | 'pending' | 'none'
export type ReviewState = 'approved' | 'changes_requested' | 'commented'
export type PrState = 'open' | 'merged' | 'closed'

export type Review = { reviewer: string; state: ReviewState; at: string }
export type Message = { author: string; at: string; body: string; threadId: string | null }

export type OpenPr = PrRef & {
  authorIsBot: boolean
  createdAt: string
  isDraft: boolean
  isReady?: boolean
  ci: CiState
  ciAt: string | null
  reviews: Review[]
  messages: Message[]
}

export type HistoryPr = PrRef & {
  authorIsBot: boolean
  state: PrState
  createdAt: string
  mergedAt: string | null
  closedAt: string | null
  reviews: Review[]
}

export type PrThread = PrRef & { state: PrState; reviews: Review[]; messages: Message[] }

export type QueuedPr = PrRef & {
  createdAt: string
  ageDays: number
  isDraft: boolean
  isReady?: boolean
  ci: CiState
  reviewedBy: string[]
  discussion: { messages: number; participants: string[] }
}

export type Counter = {
  repo: string
  currentTicket: number
  queue: QueuedPr[]
  attendants: string[]
  lastActivityAt: string | null
  activity7d: number
}
export type CounterSplit = { visible: Counter[]; closed: Counter[] }
export type CounterSplitRule = { activeDays: number; maxVisible: number }
export type Person = { login: string; avatarUrl: string; modelId: string; homeRepo: string | null }
export type BoardEntry = { login: string; reviews: number }
export type Board = { ranking: BoardEntry[]; employeeOfTheMonth: string | null; slacking: string[] }
export type NoticeCard = BoardEntry & { rank: number }
export type StrikeState = { active: boolean; since: string | null }

export type SceneEvent =
  | { kind: 'pr_opened'; at: string; pr: PrRef }
  | { kind: 'review'; at: string; pr: PrRef; reviewer: string; state: ReviewState }
  | { kind: 'comment'; at: string; pr: PrRef; author: string; replyTo: string | null; excerpt: string }
  | { kind: 'ci'; at: string; pr: PrRef; result: 'success' | 'failure' }
  | { kind: 'merged'; at: string; pr: PrRef; queueJump: boolean }
  | { kind: 'closed'; at: string; pr: PrRef }

export type SceneEventKind = SceneEvent['kind']

export type HudStats = {
  queueNow: number
  queue7dAgo: number
  inflow7d: number
  outflow7d: number
  medianFirstReviewHours30d: number | null
  medianMergeHours30d: number | null
  unreviewedCount: number
  oldestUnreviewed: PrKey | null
  ciRedPct: number | null
}

export type SnapshotMeta = { org: string; ctoLogin: string }

export type Snapshot = {
  generatedAt: string
  stale: boolean
  meta: SnapshotMeta
  counters: Counter[]
  waitingRoom: QueuedPr[]
  people: Person[]
  board: Board
  strike: StrikeState
  oldestPr: QueuedPr | null
  events: SceneEvent[]
  stats: HudStats
}
