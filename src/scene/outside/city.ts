import { t } from '@/i18n'
import type { CarPlan, Lot, Rect } from '@/types/outside'
import { BACK_WALL_Z, FACADE_Z } from '../layout'
import { CAR_LANES, STREET_HALF_LENGTH } from './street'
import { seeded } from './textures'

export const PASTELS = ['#f2c6b4', '#cfe3d4', '#f5e1a4', '#c9d7ee', '#e8c9e0', '#f4ead8', '#d9e7c4', '#f6d0c4']
export const SHOPS = [t('ui.documentServices'), t('ui.copiesIdPhotos'), t('ui.freshBreadBakery'), t('ui.lotteryShop'), t('ui.registryOffice'), t('ui.joeSBar')]
export const SIDE_ALLEY = 6.5
const RIGHT_ALLEY = 4
const ROW_REACH = 70
const FRONT_SETBACK = 0.6
const BACK_GAP = 7
const LANE_SPEEDS = [8, 9.5]
const CAR_MODELS = ['car-sedan', 'car-taxi', 'car-van', 'car-suv', 'truck-delivery', 'car-police', 'car-sedan']

function row(from: number, direction: 1 | -1, reach: number, z: number, facing: 1 | -1, random: () => number, tall: [number, number], shops: boolean): Lot[] {
  const lots: Lot[] = []
  let edge = from
  let shop = 0
  while (Math.abs(edge - from) < reach) {
    const width = 7 + Math.floor(random() * 6)
    const depth = 10 + Math.floor(random() * 5)
    const height = tall[0] + Math.floor(random() * (tall[1] - tall[0]))
    const x = edge + (direction * width) / 2
    const zCenter = z - (facing * depth) / 2
    lots.push({
      x, z: zCenter, width, depth, height,
      color: PASTELS[Math.floor(random() * PASTELS.length)],
      facing,
      shop: shops && shop < SHOPS.length && random() < 0.8 ? SHOPS[shop++] : null,
      seed: Math.floor(random() * 1e6),
    })
    edge += direction * (width + 0.4 + random() * 1.2)
  }
  return lots
}

// Pastel neighbours: a row on each side of the street front and a taller skyline behind; across the road is a square.
export function neighborLots(footprint: Rect, seed = 42): Lot[] {
  const random = seeded(seed)
  const front = FACADE_Z - FRONT_SETBACK
  return [
    ...row(footprint.minX - SIDE_ALLEY, -1, ROW_REACH, front, 1, random, [9, 16], true),
    ...row(footprint.maxX + RIGHT_ALLEY, 1, ROW_REACH, front, 1, random, [9, 16], true).map(lot => ({ ...lot, shop: lot.shop ? SHOPS[(SHOPS.indexOf(lot.shop) + 3) % SHOPS.length] : null })),
    ...row(-ROW_REACH, 1, ROW_REACH * 2, BACK_WALL_Z - BACK_GAP, 1, random, [14, 28], false),
  ]
}

export function carPlans(): CarPlan[] {
  return CAR_MODELS.map((model, i) => ({
    id: `car-${i}`,
    model,
    lane: CAR_LANES[i % CAR_LANES.length],
    speed: LANE_SPEEDS[i % LANE_SPEEDS.length],
    offset: (i * 2 * STREET_HALF_LENGTH) / CAR_MODELS.length,
  }))
}

// Cars loop along their lane and wrap at the ends of the street.
export function carX(plan: CarPlan, seconds: number, halfLength = STREET_HALF_LENGTH): number {
  const span = halfLength * 2
  const travelled = plan.offset + plan.speed * seconds
  const wrapped = ((travelled % span) + span) % span
  return plan.lane.direction * (wrapped - halfLength)
}
