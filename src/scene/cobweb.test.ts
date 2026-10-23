import { describe, expect, it } from 'vitest'
import { cobwebLevel, cobwebLook } from './cobweb'

describe('cobwebLevel', () => {
  it('starts gathering webs at two weeks, fills in at a month and gets dusty past two months', () => {
    expect(cobwebLevel(0)).toBe(0)
    expect(cobwebLevel(13.9)).toBe(0)
    expect(cobwebLevel(14)).toBe(1)
    expect(cobwebLevel(29)).toBe(1)
    expect(cobwebLevel(30)).toBe(2)
    expect(cobwebLevel(59)).toBe(2)
    expect(cobwebLevel(60)).toBe(3)
    expect(cobwebLevel(400)).toBe(3)
  })
})

describe('cobwebLook', () => {
  it('shows nothing on fresh PRs', () => {
    expect(cobwebLook(0)).toEqual({ web: null, twin: false, spider: false, motes: 0, dust: 0 })
  })

  it('grows from a small corner web to a larger one with a spider, then a second web and more dust', () => {
    const [light, full, heavy] = [cobwebLook(1), cobwebLook(2), cobwebLook(3)]
    expect(light).toMatchObject({ web: 'small', twin: false, spider: false })
    expect(full).toMatchObject({ web: 'large', twin: false, spider: true })
    expect(heavy).toMatchObject({ web: 'large', twin: true, spider: true })
    expect(light.dust).toBeGreaterThan(0)
    expect(full.dust).toBeGreaterThan(light.dust)
    expect(heavy.dust).toBeGreaterThan(full.dust)
    expect(full.motes).toBeGreaterThan(light.motes)
    expect(heavy.motes).toBeGreaterThan(full.motes)
  })
})
