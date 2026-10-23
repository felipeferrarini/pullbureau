import { t } from '@/i18n'
import type { BrawlFrame, BrawlLimb, BrawlStar, BrawlWord } from '@/types/scene'

export const BRAWL_FRAMES = 8
export const BRAWL_FPS = 7
export const REDUCED_FRAME_S = 1.6

const WORDS = ['POW!', 'BAM!', t('ui.whack'), t('ui.thud'), 'CRASH!']
const NUMBER_EVERY = 3

// Angles around the cloud (radians, counter-clockwise from the right) where a fist or a foot pokes out.
const LIMB_SETS: BrawlLimb[][] = [
  [{ kind: 'fist', angle: 0.25 }, { kind: 'foot', angle: 3.5 }],
  [{ kind: 'fist', angle: 2.75 }, { kind: 'fist', angle: -0.35 }, { kind: 'foot', angle: 4.4 }],
  [{ kind: 'foot', angle: 0.6 }, { kind: 'fist', angle: 2.4 }],
  [{ kind: 'fist', angle: 1.25 }, { kind: 'foot', angle: -0.6 }, { kind: 'fist', angle: 3.25 }],
]

// Word spots in the frame (0..1, y down), alternating sides so the lettering jumps around.
const WORD_SPOTS: [number, number, number][] = [
  [0.27, 0.2, -0.22],
  [0.73, 0.18, 0.2],
  [0.3, 0.82, 0.16],
  [0.72, 0.8, -0.18],
]

const STAR_SPOTS: [number, number][] = [
  [0.09, 0.42], [0.92, 0.5], [0.16, 0.12], [0.86, 0.1], [0.5, 0.06], [0.1, 0.78], [0.9, 0.84], [0.55, 0.93],
]

function wordFor(frame: number, number: number): BrawlWord {
  const [x, y, tilt] = WORD_SPOTS[frame % WORD_SPOTS.length]
  const isNumber = frame % NUMBER_EVERY === 0
  const text = isNumber ? `#${number}` : WORDS[Math.floor(frame / NUMBER_EVERY + frame) % WORDS.length]
  return { text, x, y, tilt, size: isNumber ? 0.2 : 0.18 }
}

function starsFor(frame: number): BrawlStar[] {
  const count = 3 + (frame % 2)
  return Array.from({ length: count }, (_, i) => {
    const [x, y] = STAR_SPOTS[(frame * 3 + i * 2) % STAR_SPOTS.length]
    return { x, y, size: 0.05 + ((frame + i) % 3) * 0.018, spin: (frame * 0.7 + i * 1.3) % (Math.PI * 2) }
  })
}

// A short comic loop: limbs, impact stars and lettering pop in and out from frame to frame.
export function brawlFrames(number: number): BrawlFrame[] {
  return Array.from({ length: BRAWL_FRAMES }, (_, frame) => ({
    limbs: LIMB_SETS[frame % LIMB_SETS.length],
    stars: starsFor(frame),
    word: wordFor(frame, number),
    wobble: frame * 1.9,
  }))
}

export const brawlFrameAt = (seconds: number, reduced: boolean) =>
  Math.floor(Math.max(0, seconds) * (reduced ? 1 / REDUCED_FRAME_S : BRAWL_FPS)) % BRAWL_FRAMES
