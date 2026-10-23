import { describe, expect, it } from 'vitest'
import { CURB_Z, LAMP_Z, PLATFORM, SIDEWALK_Y, STEPS, lampXs } from '@/scene/outside/street'
import { HELI_EXIT, HELI_HALF_WIDTH, HELI_HEADING, HELI_LANDING, ROTOR_IDLE, ROTOR_RADIUS, doorOpen, heliPose, heliTiming, rotorKeys } from './helicopter'

const timing = heliTiming(30_000)
const flat = (x: number, z: number) => Math.hypot(x - HELI_LANDING[0], z - HELI_LANDING[2])

describe('landing spot', () => {
  it('sits on the sidewalk at the foot of the steps, short of the curb', () => {
    expect(HELI_LANDING[1]).toBe(SIDEWALK_Y)
    expect(Math.abs(HELI_LANDING[0])).toBeLessThan(1)
    expect(HELI_LANDING[2] - HELI_HALF_WIDTH).toBeGreaterThan(STEPS.maxZ)
    expect(HELI_LANDING[2] + ROTOR_RADIUS).toBeLessThan(CURB_Z)
  })

  it('keeps the rotor clear of the portico columns', () => {
    for (const x of [PLATFORM.minX + 0.3, PLATFORM.maxX - 0.3]) expect(flat(x, PLATFORM.maxZ - 0.25)).toBeGreaterThan(ROTOR_RADIUS + 0.5)
  })

  it('keeps the rotor clear of the street lamps', () => {
    for (const x of lampXs()) expect(flat(x, LAMP_Z)).toBeGreaterThan(ROTOR_RADIUS + 1)
  })

  it('lets the inspector out on the building side, outside the skids', () => {
    expect(HELI_EXIT[2]).toBeLessThan(HELI_LANDING[2] - HELI_HALF_WIDTH)
    expect(HELI_EXIT[2]).toBeGreaterThan(STEPS.maxZ)
    expect(HELI_EXIT[1]).toBe(0)
  })
})

describe('heliTiming', () => {
  it('lands, lets him out, waits while he is inside and leaves after he boards', () => {
    expect(timing.touchdown).toBeGreaterThan(8000)
    expect(timing.exit).toBeGreaterThan(timing.touchdown)
    expect(timing.board).toBe(timing.exit + 30_000)
    expect(timing.liftoff).toBeGreaterThan(timing.board)
    expect(timing.gone).toBeGreaterThan(timing.liftoff + 8000)
  })
})

describe('heliPose', () => {
  it('flies in high from the left, far from the building', () => {
    const start = heliPose(0, timing)
    expect(start.phase).toBe('approach')
    expect(start.position[0]).toBeLessThan(-60)
    expect(start.position[1]).toBeGreaterThan(12)
  })

  it('comes down smoothly onto the landing spot facing along the street', () => {
    const hover = heliPose(timing.touchdown - 2000, timing)
    expect(hover.phase).toBe('descend')
    expect(hover.position[1]).toBeGreaterThan(SIDEWALK_Y)
    const landed = heliPose(timing.touchdown + 500, timing)
    expect(landed.phase).toBe('landed')
    expect(landed.position).toEqual(HELI_LANDING)
    expect(landed.yaw).toBeCloseTo(HELI_HEADING)
    expect(landed.pitch).toBe(0)
  })

  it('never teleports: at most a fast helicopter (60 m/s) between samples', () => {
    for (let t = 0; t < timing.gone; t += 100) {
      const a = heliPose(t, timing).position
      const b = heliPose(t + 100, timing).position
      expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(6)
    }
  })

  it('idles the rotor on the ground and spins it back up to lift off', () => {
    expect(heliPose(timing.exit + 5000, timing).rotor).toBeCloseTo(ROTOR_IDLE)
    expect(heliPose(timing.liftoff, timing).rotor).toBeCloseTo(1)
    expect(heliPose(timing.liftoff + 2500, timing).position[1]).toBeGreaterThan(SIDEWALK_Y + 2)
  })

  it('blows dust only near the ground', () => {
    expect(heliPose(0, timing).wash).toBe(0)
    expect(heliPose(timing.touchdown + 200, timing).wash).toBeGreaterThan(0.8)
    expect(heliPose(timing.exit + 5000, timing).wash).toBeLessThan(heliPose(timing.touchdown + 200, timing).wash)
  })

  it('flies away to the right and is gone at the end', () => {
    const leaving = heliPose(timing.gone - 500, timing)
    expect(leaving.phase).toBe('depart')
    expect(leaving.position[0]).toBeGreaterThan(60)
    expect(heliPose(timing.gone + 1, timing).phase).toBe('gone')
  })
})

describe('doorOpen', () => {
  it('opens for the inspector to get out and to get back in, and is shut in flight', () => {
    expect(doorOpen(0, timing)).toBe(0)
    expect(doorOpen(timing.exit, timing)).toBe(1)
    expect(doorOpen(timing.exit + 5000, timing)).toBe(0)
    expect(doorOpen(timing.board, timing)).toBe(1)
    expect(doorOpen(timing.liftoff, timing)).toBe(0)
  })
})

describe('rotorKeys', () => {
  it('fades the chop in, idles it while landed and fades it out as it leaves', () => {
    const keys = rotorKeys(timing, 0)
    expect(keys[0]).toMatchObject({ at: 0, gain: 0 })
    expect(keys.at(-1)).toMatchObject({ gain: 0 })
    const landed = keys.find(key => key.at * 1000 > timing.touchdown + 1000)
    expect(landed?.rate).toBeLessThan(keys[0].rate)
  })

  it('starts mid-flight when the sound is switched on late', () => {
    const late = rotorKeys(timing, timing.exit)
    expect(late[0].at).toBe(0)
    expect(late[0].gain).toBeGreaterThan(0)
    expect(late.every((key, i) => i === 0 || key.at > late[i - 1].at)).toBe(true)
  })
})
