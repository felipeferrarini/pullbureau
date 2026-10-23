import manifest from './characters.generated.json'

// Every character is scaled to this height in metres (hats and hair included).
export const CHARACTER_HEIGHT = 1.8

export type CharacterManifestEntry = { id: string; file: string; height: number; animations: string[] }

export const CHARACTERS = manifest as CharacterManifestEntry[]
export const CHARACTER_BY_ID = new Map(CHARACTERS.map(entry => [entry.id, entry]))
export const PERSON_MODEL_IDS = CHARACTERS.map(entry => entry.id).filter(id => !/skelet|zombie|^cow$|^pug$/i.test(id))
export const SKELETON_MODEL_ID = CHARACTERS.find(entry => /skelet/i.test(entry.id))?.id ?? null // the pack has no skeleton: PRs older than 60 days render dusty grey instead
