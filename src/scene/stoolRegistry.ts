import type { StoolPhase } from './seat'

const phases = new Map<string, StoolPhase>()

export const setStoolPhase = (id: string, phase: StoolPhase) => phases.set(id, phase)
export const stoolPhase = (id: string) => phases.get(id) ?? null
export const clearStoolPhase = (id: string) => phases.delete(id)
