import { hashString } from '@/shared/hash'
import type { LogicalAnim } from '@/types/scene'

const MOVES: LogicalAnim[] = ['victory', 'jump', 'victory']

export const danceFor = (actorId: string): LogicalAnim => MOVES[hashString(`baile:${actorId}`) % MOVES.length]

export const DISCO_COLORS = ['#ff3cac', '#00e5ff', '#ffe600', '#7cff4f', '#b14dff', '#ff7a00']

export function sparkleSpots(count: number, radius: number): [number, number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const golden = i * 2.399963
    const r = radius * Math.sqrt((i + 0.5) / count)
    return [Math.cos(golden) * r, Math.sin(golden) * r, (i * 0.6180339) % 1]
  })
}
