export const CUTAWAY_FROM = 6
export const CUTAWAY_TO = 10

export function cutawayLevel(cameraY: number): number {
  const t = Math.min(1, Math.max(0, (cameraY - CUTAWAY_FROM) / (CUTAWAY_TO - CUTAWAY_FROM)))
  return 1 - t * t * (3 - 2 * t)
}
