import type { Object3D } from 'three'

const registry = new Map<string, Object3D>()

export function registerActor(id: string, object: Object3D): () => void {
  registry.set(id, object)
  return () => {
    if (registry.get(id) === object) registry.delete(id)
  }
}

export const actorObject = (id: string) => registry.get(id) ?? null
export const actorObjects = () => registry.values()
