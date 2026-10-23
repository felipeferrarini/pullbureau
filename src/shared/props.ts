import type { PropCategory, PropManifestEntry } from '@/types/props'
import manifest from './props.generated.json'

export type PropId = string

export const PROPS = manifest as PropManifestEntry[]
export const PROP_BY_ID = new Map(PROPS.map(entry => [entry.id, entry]))
export const PROP_IDS: PropId[] = PROPS.map(entry => entry.id)

export const HDRI_DAY = '/hdri/kloofendal_43d_clear_puresky_1k.hdr'
export const HDRI_NIGHT = '/hdri/kloppenheim_02_puresky_1k.hdr'

export function getProp(id: PropId): PropManifestEntry {
  const entry = PROP_BY_ID.get(id)
  if (!entry) throw new Error(`unknown prop: ${id}`)
  return entry
}

export const propsByCategory = (category: PropCategory) => PROPS.filter(entry => entry.category === category)
