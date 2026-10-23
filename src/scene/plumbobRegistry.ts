import type { Color, Object3D } from 'three'

export type PlumbobEntry = { anchor: Object3D; color: Color; emissive: number }

const entries = new Map<string, PlumbobEntry>()

export const registerPlumbob = (id: string, entry: PlumbobEntry) => {
  entries.set(id, entry)
  return () => void (entries.get(id) === entry && entries.delete(id))
}
export const plumbobEntries = () => entries.values()
export const plumbobCount = () => entries.size
