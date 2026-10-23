export type PropCategory =
  | 'furniture' | 'office' | 'kitchen' | 'decor'
  | 'vehicle' | 'nature' | 'street' | 'road' | 'building'

export type PropKit =
  | 'furniture-kit' | 'car-kit' | 'nature-kit'
  | 'city-kit-commercial' | 'city-kit-suburban' | 'city-kit-roads'

export type PropSize = [x: number, y: number, z: number]

export type PropSource = {
  id: string
  kit: PropKit
  model: string
  category: PropCategory
  scale: number
  keepNodes?: boolean
}

export type PropManifestEntry = {
  id: string
  file: string
  category: PropCategory
  size: PropSize
  nodes?: string[]
}
