import { copaSpot } from '@/scene/layout'
import type { Actor, Vec3 } from '@/types/scene'

// During the 15h coffee break every seated attendant walks to the copa, after the ones already idling there.
export function coffeeSpots(actors: Actor[], hallCount: number): Map<string, { position: Vec3; facing: number }> {
  const attendants = actors.filter(actor => actor.kind === 'attendant')
  const idle = attendants.filter(actor => actor.repo === null).length
  const working = attendants.filter(actor => actor.repo !== null)
  return new Map(working.map((actor, i) => [actor.id, { position: copaSpot(idle + i, hallCount), facing: chatFacing(idle + i) }]))
}

// Columns of the copa grid chat in pairs: the first faces right, the others face left.
export const chatFacing = (slot: number) => (slot % 3 === 0 ? Math.PI / 2 : -Math.PI / 2)

export const COFFEE_MACHINE_OFFSET: Vec3 = [0.7, 1.26, 0.46]
