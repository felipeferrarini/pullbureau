import type { BufferGeometry, Color, Side } from 'three'
import type { Counter, QueuedPr, Snapshot } from './domain'
import type { HeliTiming } from './eggs'

export type LogicalAnim =
  | 'idle' | 'walk' | 'run' | 'sit' | 'wave' | 'yes' | 'no'
  | 'victory' | 'punch' | 'hit' | 'death' | 'jump' | 'roll' | 'interact'

export type Vec3 = [number, number, number]
export type Pose = 'standing' | 'sitting' | 'sleeping' | 'skeleton'
export type ActorKind = 'customer' | 'waiting' | 'attendant' | 'visitor'

export type Actor = {
  id: string
  kind: ActorKind
  login: string
  modelId: string
  position: Vec3
  facing: number
  pose: Pose
  anim: LogicalAnim
  dusty: boolean
  pr: QueuedPr | null
  repo: string | null
  outside: boolean
}

export type SceneIndex = {
  actors: Map<string, Actor>
  counterIndex: Map<string, number>
  queueLength: Map<string, number>
  queueHead: Map<string, number>
  counterCount: number
  modelFor: (login: string) => string
}

export type Override = {
  actorId: string
  at: number
  target?: Vec3
  from?: Vec3
  anim?: LogicalAnim
  moveAnim?: LogicalAnim
  facing?: number
  run?: boolean
}

export type ActiveOverride = Override & { key: string }

export type SoundName = 'ding' | 'stamp' | 'buzz' | 'fanfare' | 'tension' | 'whoosh' | 'ticket' | 'chime' | 'punch' | 'swing' | 'crowd' | 'gong' | 'ko' | 'tbc' | 'trapdoor' | 'bark' | 'siren' | 'alarm' | 'partyHorn'
export type StampVariant = 'approved' | 'rejected' | 'review'
export type BubbleView = { key: string; text: string; replyTo: string | null; startedAt: number }

type Timed = { at: number; duration: number }

export type Effect =
  | ({ kind: 'bubble'; actorId: string; text: string; replyTo?: string | null } & Timed)
  | ({ kind: 'stamp'; position: Vec3; variant: StampVariant } & Timed)
  | ({ kind: 'confetti'; position: Vec3 } & Timed)
  | ({ kind: 'trapdoor'; position: Vec3 } & Timed)
  | ({ kind: 'lamp'; repo: string; color: 'red' | 'green' } & Timed)
  | ({ kind: 'banner'; text: string } & Timed)
  | ({ kind: 'sound'; sound: SoundName } & Timed)
  | ({ kind: 'jumpSign'; actorId: string } & Timed)
  | ({ kind: 'alarm' } & Timed)
  | ({ kind: 'helicopter'; timing: HeliTiming } & Timed)

export type ActiveEffect = Effect & { key: string; elapsed: number }
export type Spawn = { actor: Actor; from: number; until: number }

export type Plan = {
  id: string
  repo: string | null
  duration: number
  overrides: Override[]
  effects: Effect[]
  spawns: Spawn[]
}

export type StartedPlan = Plan & { startedAt: number }

export type IntroActor = Pick<Actor, 'id' | 'kind' | 'repo'>
export type IntroRoute = { actorId: string; start: Vec3; waypoints: Vec3[]; delay: number }
export type SearchParamsLike = { get(name: string): string | null }

export type MaterialRole = 'skin' | 'face' | 'hair' | 'clothes'
export type CharacterLook = { skin: string; hairHue: number; clothesHue: number }
export type IdleRhythm = { offset: number; speed: number }
export type PlumbobStyle = { color: string; glow: number; pulse: boolean }
export type ArrangedCounters = { counters: Counter[]; hallCount: number; closedCount: number }
export type HallLayout = ArrangedCounters & { snapshot: Snapshot; hiddenCount: number; lanes: QueueLane[] }
export type PropPlacement = { position: Vec3; rotation?: number; scale?: number }
export type QueuePlace = { position: Vec3; facing: number }
export type Rail = { from: [number, number]; to: [number, number] }
export type FloorPoint = [number, number]
export type QueueLane = { index: number; points: FloorPoint[]; door: number | null; row: number | null }
export type LaneTape = { index: number; color: string; rail: Rail; sign: FloorPoint }
export type FloorRect = { minX: number; maxX: number; minZ: number; maxZ: number }
export type SceneSpot = 'board'

export type Quality = 'low' | 'normal' | 'high'
export type QualityProfile = {
  maxDpr: number
  maxPixels: number
  fps: number
  shadowMapSize: number
  shadowHz: number
  ao: boolean
  bloom: boolean
  multisampling: number
  adaptive: boolean
}
export type ViewportSize = { width: number; height: number; devicePixelRatio: number }
export type ScaleState = { scale: number; streak: number }
export type FrameSignals = { now: number; lastInputAt: number; motionUntil: number; dragging: boolean }

export type CobwebLevel = 0 | 1 | 2 | 3
export type CobwebLook = { web: 'small' | 'large' | null; twin: boolean; spider: boolean; motes: number; dust: number }

export type VertexRange = { start: number; count: number }
export type BodyPart = VertexRange & { name: string; color: Color }
export type MergedBody = { geometry: BufferGeometry; parts: BodyPart[]; side: Side }

export type BrawlLimb = { kind: 'fist' | 'foot'; angle: number }
export type BrawlStar = { x: number; y: number; size: number; spin: number }
export type BrawlWord = { text: string; x: number; y: number; tilt: number; size: number }
export type BrawlFrame = { limbs: BrawlLimb[]; stars: BrawlStar[]; word: BrawlWord; wobble: number }
