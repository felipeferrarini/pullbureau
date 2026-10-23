import { describe, expect, it } from 'vitest'
import type { Vec3 } from '@/types/scene'
import { BOARD_SPAN, boardCamera } from './boardLayout'
import { BACK_WALL_Z } from './layout'

const polar = (goal: { position: Vec3; target: Vec3 }) => {
  const [dx, dy, dz] = goal.position.map((value, i) => value - goal.target[i])
  return Math.atan2(Math.hypot(dx, dz), dy)
}

describe('boardCamera', () => {
  it('frames the board from the front within the orbit limits', () => {
    const goal = boardCamera(16 / 10)
    expect(goal.target[2]).toBe(BACK_WALL_Z)
    expect(goal.position[2]).toBeGreaterThan(BACK_WALL_Z + 8)
    expect(goal.target[0]).toBeCloseTo((BOARD_SPAN.minX + BOARD_SPAN.maxX) / 2)
    expect(polar(goal)).toBeLessThan(1.32)
    expect(polar(goal)).toBeGreaterThan(0.45)
  })
})
