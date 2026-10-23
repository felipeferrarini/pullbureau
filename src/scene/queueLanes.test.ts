import { describe, expect, it } from 'vitest'
import type { FloorPoint, QueueLane, Vec3 } from '@/types/scene'
import { lobbyBins, lobbyPlants, priorityBenches, priorityLane, waitingBenches } from './hall/lobbyLayout'
import { BACK_WALL_Z, ENTRANCE_HALF, FACADE_Z, FACING_COUNTER, LOBBY_BACK_Z, MAX_INSIDE, QUEUE_SPACING, counterX, corridorStartX, corridorWidth, hallWidth, sceneBounds, totemSpot } from './layout'
import { SIDEWALK_Y, groundHeight } from './outside/street'
import { DOOR_LANES, OUTSIDE_ROWS, TURN_ROWS, backOfLine, laneRopes, lanePlace, laneTapes, occupiedPath, queueLanes, queuePlace, queueSlot } from './queueLanes'

const LIVE = [26, 20, 17, 8, 5, 5, 3, 3, 2, 2]
const DEMO = [16, 8, 7, 7, 7, 2, 2, 2, 1, 1]
const HEAVY = [60, 48, 40, 33, 25, 18, 7, 5, 3, 2]
const CASES: { name: string; lengths: number[]; count: number; closed: number }[] = [
  { name: 'live', lengths: LIVE, count: 10, closed: 0 },
  { name: 'demo', lengths: DEMO, count: 10, closed: 0 },
  { name: 'heavy', lengths: HEAVY, count: 10, closed: 0 },
  { name: 'small hall', lengths: [40, 30, 12, 9], count: 4, closed: 0 },
  { name: 'closed corridor', lengths: [...LIVE, 14, 3], count: 10, closed: 2 },
  { name: 'busy on the right', lengths: [9, 3, 2, 2, 2, 2, 2, 2, 30, 40], count: 10, closed: 0 },
]

const slots = (lane: QueueLane, length: number) => Array.from({ length }, (_, slot) => lanePlace(lane, slot).position)

function cross(a: FloorPoint, b: FloorPoint, c: FloorPoint, d: FloorPoint): boolean {
  const orient = (p: FloorPoint, q: FloorPoint, r: FloorPoint) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]))
  return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0
}

function pathsCross(p: FloorPoint[], q: FloorPoint[]): boolean {
  for (let i = 1; i < p.length; i++) for (let j = 1; j < q.length; j++) if (cross(p[i - 1], p[i], q[j - 1], q[j])) return true
  return false
}

// Samples a path every 5 cm, so a wall can be checked point by point.
function sample(path: FloorPoint[]): FloorPoint[] {
  return path.slice(1).flatMap((to, i) => {
    const from = path[i]
    const steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / 0.05))
    return Array.from({ length: steps }, (_, k): FloorPoint => [from[0] + ((to[0] - from[0]) * k) / steps, from[1] + ((to[1] - from[1]) * k) / steps])
  })
}

function wallCrossings(path: FloorPoint[], count: number, closed: number): string[] {
  const half = hallWidth(count) / 2
  const right = sceneBounds(count, closed).maxX
  const sideWalls = closed > 0 ? [-half, half, right] : [-half, half]
  const problems: string[] = []
  const points = sample(path)
  for (let i = 1; i < points.length; i++) {
    const [[x1, z1], [x2, z2]] = [points[i - 1], points[i]]
    const besideHall = x1 > -half && x1 < right
    if ((z1 - FACADE_Z) * (z2 - FACADE_Z) < 0 && besideHall && Math.abs(x1) > ENTRANCE_HALF - 0.3) problems.push(`front wall at x=${x1.toFixed(2)}`)
    for (const wall of sideWalls) if ((x1 - wall) * (x2 - wall) < 0 && z1 > BACK_WALL_Z && z1 < FACADE_Z) problems.push(`side wall ${wall} at z=${z1.toFixed(2)}`)
  }
  return problems
}

describe('queueLanes', () => {
  it('keeps short queues in a straight lane facing their counter', () => {
    const lanes = queueLanes(LIVE, 10)
    for (const index of [4, 9]) {
      const places = Array.from({ length: LIVE[index] }, (_, slot) => lanePlace(lanes[index], slot))
      expect(places.every(place => place.position[0] === counterX(index, 10) && place.facing === FACING_COUNTER)).toBe(true)
      expect(places.at(-1)?.position[2]).toBeLessThan(LOBBY_BACK_Z)
    }
  })

  it('keeps the first slots of an overflowing queue in its straight lane', () => {
    const lanes = queueLanes(LIVE, 10)
    expect(slots(lanes[0], MAX_INSIDE)).toEqual(slots(queueLanes([1], 10)[0], MAX_INSIDE).map((_, slot) => queueSlot(0, 10, slot)))
  })

  for (const { name, lengths, count, closed } of CASES) {
    describe(name, () => {
      const lanes = queueLanes(lengths, count, closed)
      const footprint = { minX: sceneBounds(count, closed).minX, maxX: sceneBounds(count, closed).maxX, minZ: BACK_WALL_Z, maxZ: FACADE_Z }
      const people = lanes.map((lane, i) => slots(lane, lengths[i]))

      it('puts slot i + 1 right behind slot i', () => {
        for (const line of people) {
          for (let i = 1; i < line.length; i++) {
            const gap = Math.hypot(line[i][0] - line[i - 1][0], line[i][2] - line[i - 1][2])
            expect(gap).toBeLessThanOrEqual(QUEUE_SPACING + 1e-9)
            expect(gap).toBeGreaterThan(0.6)
          }
        }
      })

      it('never lets two lines cross or two people share a spot', () => {
        const paths = lanes.map((lane, i) => occupiedPath(lane, lengths[i]))
        for (let a = 0; a < paths.length; a++) for (let b = a + 1; b < paths.length; b++) expect(pathsCross(paths[a], paths[b])).toBe(false)
        const everyone = people.flatMap((line, lane) => line.map(position => ({ lane, position })))
        for (let i = 0; i < everyone.length; i++) {
          for (let j = i + 1; j < everyone.length; j++) {
            if (everyone[i].lane === everyone[j].lane) continue
            const [p, q] = [everyone[i].position, everyone[j].position]
            expect(Math.hypot(p[0] - q[0], p[2] - q[2])).toBeGreaterThan(0.55)
          }
        }
      })

      it('never walks a line through a wall', () => {
        for (const [i, lane] of lanes.entries()) expect(wallCrossings(occupiedPath(lane, lengths[i]), count, closed)).toEqual([])
      })

      it('ropes the winding lanes off from each other without cutting through anyone', () => {
        const ropes = laneRopes(lanes, lengths)
        const paths = lanes.map((lane, i) => occupiedPath(lane, lengths[i]))
        for (const rope of ropes) for (const path of paths) expect(pathsCross([rope.from, rope.to], path)).toBe(false)
        const points = ropes.flatMap(rope => sample([rope.from, rope.to]))
        for (const [x, , z] of people.flat().filter(([, , pz]) => pz > 0)) expect(Math.min(...points.map(([px, pz]) => Math.hypot(px - x, pz - z)), 9)).toBeGreaterThan(0.25)
        expect(points.every(([, z]) => z < FACADE_Z)).toBe(true)
      })

      it('tapes each outside row in its counter colour, out on the flat sidewalk', () => {
        const tapes = laneTapes(lanes, lengths)
        expect(new Set(tapes.map(tape => tape.color)).size).toBe(tapes.length)
        for (const { rail } of tapes) {
          const [x, z] = rail.from
          expect(groundHeight(x, z, footprint)).toBe(SIDEWALK_Y)
        }
        const paths = lanes.map((lane, i) => occupiedPath(lane, lengths[i]))
        for (const { rail } of tapes) for (const path of paths) expect(pathsCross([rail.from, rail.to], path)).toBe(false)
      })

      it('keeps the outside part off the building', () => {
        const right = sceneBounds(count, closed).maxX
        const outside = people.flat().filter(([x, , z]) => z > FACADE_Z || x > right)
        expect(outside.every(([x, , z]) => z > FACADE_Z || x > right + 0.5)).toBe(true)
      })
    })
  }

  it('files the overflowing lanes through the door side by side in counter order', () => {
    const lanes = queueLanes(HEAVY, 10).filter(lane => lane.door !== null)
    expect(lanes.map(lane => lane.index)).toEqual([0, 1, 2, 3, 4, 5])
    const doors = lanes.map(lane => lane.door as number)
    expect(doors).toEqual([...doors].sort((a, b) => a - b))
    expect(doors[0]).toBeGreaterThanOrEqual(DOOR_LANES.first)
    expect(doors.at(-1)).toBeLessThanOrEqual(ENTRANCE_HALF - 0.3)
  })

  it('leaves the middle of the door free for people walking in', () => {
    for (const { lengths, count, closed } of CASES) {
      const lanes = queueLanes(lengths, count, closed)
      const near = lanes.flatMap((lane, i) => sample(occupiedPath(lane, lengths[i]))).filter(([, z]) => Math.abs(z - FACADE_Z) < 1.5)
      expect(near.every(([x]) => x > 0.5)).toBe(true)
    }
  })

  it('turns towards the door between the counter lanes and the benches', () => {
    const lanes = queueLanes(HEAVY, 10).filter(lane => lane.door !== null)
    const turns = lanes.map(lane => lane.points[1][1])
    expect(turns.every(z => z >= TURN_ROWS.first && z <= TURN_ROWS.last)).toBe(true)
    const benches = [...waitingBenches(10), ...priorityBenches(10)].map(bench => bench.position[2])
    expect(Math.min(...benches) - 0.3).toBeGreaterThan(TURN_ROWS.last + 0.4)
  })

  it('keeps every line off the lobby furniture', () => {
    const things: Vec3[] = [
      ...waitingBenches(10).map(b => b.position),
      ...priorityBenches(10).map(b => b.position),
      ...lobbyPlants(10).map(p => p.position),
      ...lobbyBins().map(b => b.position),
      priorityLane(10).sign,
      totemSpot(),
    ]
    for (const { lengths } of CASES.filter(c => c.count === 10 && c.closed === 0)) {
      const lanes = queueLanes(lengths, 10)
      const points = lanes.flatMap((lane, i) => sample(occupiedPath(lane, lengths[i])))
      for (const [x, , z] of things) expect(Math.min(...points.map(([px, pz]) => Math.hypot(px - x, pz - z)))).toBeGreaterThan(0.6)
    }
  })

  it('sends the first outside row down the ramp and the far rows along the sidewalk, round the corner', () => {
    const lanes = queueLanes(HEAVY, 10)
    const nearest = lanes.find(lane => lane.row === 0) as QueueLane
    expect(nearest.points.some(([, z]) => z === OUTSIDE_ROWS[0])).toBe(true)
    const last = lanePlace(lanes[0], 200).position
    expect(last[0]).toBeGreaterThan(hallWidth(10) / 2)
    expect(last[2]).toBeLessThan(FACADE_Z)
  })

  it('folds an abandoned counter line back inside the closed corridor', () => {
    const lanes = queueLanes([3, 2, 20], 2, 1)
    const corridor = { from: corridorStartX(2), to: corridorStartX(2) + corridorWidth(1) }
    const line = slots(lanes[2], 20)
    expect(line.every(([x, , z]) => x > corridor.from && x < corridor.to && z < FACADE_Z - 1)).toBe(true)
  })

  it('faces the one ahead along the line', () => {
    const lanes = queueLanes(HEAVY, 10)
    const sidewalk = slots(lanes[0], 120).map((position, slot) => ({ position, facing: lanePlace(lanes[0], slot).facing }))
    const along = sidewalk.find(({ position }) => position[2] > FACADE_Z + 1 && position[0] > 12)
    expect(along?.facing).toBeCloseTo(-Math.PI / 2)
  })

  it('sends a newcomer to the end of their own line', () => {
    expect(backOfLine(1, 10, LIVE).position).toEqual(queueSlot(1, 10, LIVE[1], LIVE))
    expect(backOfLine(4, 10, LIVE).position).toEqual(queueSlot(4, 10, LIVE[4]))
    const full = [MAX_INSIDE, 2]
    expect(backOfLine(0, 2, full).position).toEqual(queuePlace(0, 2, MAX_INSIDE, [MAX_INSIDE + 1, 2]).position)
  })
})
