import type { LogicalAnim } from '@/types/scene'

const PATTERNS: Record<LogicalAnim, RegExp[]> = {
  idle: [/^idle$/i, /idle/i],
  walk: [/^walk$/i, /^walk(?!.*carry)/i],
  run: [/^run$/i, /^run(?!.*carry)/i],
  sit: [/^sit/i, /sit/i],
  wave: [/wave/i, /^jump$/i],
  yes: [/^yes$/i, /yes/i, /victory/i],
  no: [/^no$/i, /defeat/i],
  victory: [/victory/i, /cheer/i, /dance/i],
  punch: [/punch/i, /attack/i, /slash/i],
  hit: [/hit|receive|recieve/i],
  death: [/death|die/i],
  jump: [/^jump$/i, /jump/i],
  roll: [/roll/i],
  interact: [/interact|pick_?up/i, /punch/i],
}

const shortName = (clip: string) => clip.split('|').pop() ?? clip

function find(clipNames: string[], anim: LogicalAnim): string | null {
  for (const pattern of PATTERNS[anim]) {
    const match = clipNames.find(clip => pattern.test(shortName(clip)))
    if (match) return match
  }
  return null
}

export function resolveClip(clipNames: string[], anim: LogicalAnim): string | null {
  return find(clipNames, anim) ?? find(clipNames, 'idle') ?? clipNames[0] ?? null
}

// Moves that end in a pose: they play once and hold the last frame (sitting stays seated).
const ONE_SHOT = new Set<LogicalAnim>(['sit', 'death', 'interact'])
const STRIKES = new Set<LogicalAnim>(['punch', 'hit', 'death'])

export const playsOnce = (anim: LogicalAnim) => ONE_SHOT.has(anim)
export const isStrike = (anim: LogicalAnim) => STRIKES.has(anim)

// How far into the clip (0..1) an anim starts. Loops start at the character's own desync offset;
// a one-shot starts from the top when the character switches into it, and already finished when
// the character shows up in it (someone seated at page load is just seated).
export function clipLead(anim: LogicalAnim, previous: LogicalAnim | null, desync: number): number {
  if (playsOnce(anim)) return previous === null || previous === anim ? 1 : 0
  return isStrike(anim) ? 0 : desync
}
