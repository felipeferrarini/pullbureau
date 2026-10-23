import { describe, expect, it } from 'vitest'
import { skyLook, sunDirection } from './skyLook'

describe('skyLook', () => {
  it('turns the street lamps and the interior lights on outside daylight', () => {
    expect(skyLook({ phase: 'day', sun: 0.5 })).toMatchObject({ lampsOn: false, night: false, stars: 0, interior: 0 })
    expect(skyLook({ phase: 'dusk', sun: 1 })).toMatchObject({ lampsOn: true, night: false })
    expect(skyLook({ phase: 'night', sun: 0 })).toMatchObject({ lampsOn: true, night: true, stars: 1, interior: 1 })
  })

  it('dims the key light at night', () => {
    expect(skyLook({ phase: 'night', sun: 0 }).sunIntensity).toBeLessThan(skyLook({ phase: 'day', sun: 0.5 }).sunIntensity / 3)
  })
})

describe('sunDirection', () => {
  const unit = (v: number[]) => Math.hypot(...v)

  it('rises on the left, sets on the right and never stands overhead', () => {
    const morning = sunDirection({ phase: 'day', sun: 0.1 })
    const noon = sunDirection({ phase: 'day', sun: 0.5 })
    const evening = sunDirection({ phase: 'day', sun: 0.9 })
    expect(morning[0]).toBeLessThan(0)
    expect(evening[0]).toBeGreaterThan(0)
    expect(noon[1]).toBeGreaterThan(morning[1])
    expect(noon[1]).toBeLessThan(0.9)
    for (const v of [morning, noon, evening]) expect(unit(v)).toBeCloseTo(1)
  })
})
