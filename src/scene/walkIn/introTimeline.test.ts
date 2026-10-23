import { describe, expect, it } from 'vitest'
import type { IntroRoute } from '@/types/scene'
import { DOOR, FACADE_Z, overviewCamera } from '../layout'
import { CURB_Z } from '../outside/street'
import { DOOR_OPEN_S, INTRO_CAMERA_END_S, INTRO_WALK_SPEED, WALK_START_S, introCamera, introPosition, introTotal, scheduleRoutes } from './introTimeline'

const route: IntroRoute = { actorId: 'a', start: [4, 0, 12], waypoints: [[4, 0, 12], DOOR.outside, DOOR.inside, [0, 0, -6]], delay: 2 }

describe('scheduleRoutes', () => {
  it('holds everyone outside until the doors open, then keeps the order', () => {
    const scheduled = scheduleRoutes([route, { ...route, actorId: 'b', delay: 10 }])
    expect(scheduled[0].delay).toBeGreaterThan(DOOR_OPEN_S)
    expect(scheduled[0].delay).toBeGreaterThanOrEqual(WALK_START_S)
    expect(scheduled[1].delay).toBeGreaterThan(scheduled[0].delay)
  })

  it('lasts long enough for the camera and the last walker', () => {
    expect(introTotal(scheduleRoutes([route]))).toBeGreaterThanOrEqual(INTRO_CAMERA_END_S)
  })
})

describe('introPosition', () => {
  it('waits at the start facing the first leg', () => {
    expect(introPosition(route, 1)).toMatchObject({ position: route.start, moving: false })
    expect(introPosition(route, 1).heading).toBeCloseTo(Math.atan2(DOOR.outside[0] - 4, DOOR.outside[2] - 12))
  })

  it('walks the waypoints at the intro pace and stops at the target', () => {
    const firstLeg = Math.hypot(4, 12 - DOOR.outside[2])
    const atDoor = introPosition(route, route.delay + firstLeg / INTRO_WALK_SPEED)
    expect(atDoor.position[0]).toBeCloseTo(DOOR.outside[0])
    expect(atDoor.position[2]).toBeCloseTo(DOOR.outside[2])
    expect(introPosition(route, 999)).toEqual({ position: [0, 0, -6], moving: false, heading: null })
  })
})

describe('introCamera', () => {
  const overview = overviewCamera(10, 16 / 10)

  it('starts across the street, at eye level', () => {
    const { position } = introCamera(0, overview)
    expect(position[2]).toBeGreaterThan(CURB_Z)
    expect(position[1]).toBeLessThan(2.5)
  })

  it('goes through the door opening, not the wall', () => {
    let crossing = null
    for (let t = 0; t < INTRO_CAMERA_END_S; t += 0.02) {
      const { position } = introCamera(t, overview)
      if (position[2] <= FACADE_Z) {
        crossing = position
        break
      }
    }
    expect(crossing).not.toBeNull()
    expect(Math.abs(crossing?.[0] ?? 9)).toBeLessThan(1.4)
    expect(crossing?.[1] ?? 9).toBeLessThan(2.7)
  })

  it('lands exactly on the overview', () => {
    const end = introCamera(INTRO_CAMERA_END_S + 5, overview)
    end.position.forEach((value, i) => expect(value).toBeCloseTo(overview.position[i]))
    end.target.forEach((value, i) => expect(value).toBeCloseTo(overview.target[i]))
  })
})
