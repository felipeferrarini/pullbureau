import { describe, expect, it } from 'vitest'
import { SKIN_TONES, idleRhythm, lookFor, materialRole } from './characterLook'

describe('lookFor', () => {
  it('gives the same person the same look every time', () => {
    expect(lookFor('example-user')).toEqual(lookFor('example-user'))
  })

  it('draws skin tones from the natural palette and spreads them across people', () => {
    const logins = Array.from({ length: 60 }, (_, i) => `dev-${i}`)
    const tones = new Set(logins.map(login => lookFor(login).skin))
    for (const tone of tones) expect(SKIN_TONES).toContain(tone)
    expect(tones.size).toBeGreaterThanOrEqual(5)
  })

  it('keeps hair and clothing hue shifts subtle', () => {
    for (const login of ['a', 'b', 'alice', 'frank']) {
      const { hairHue, clothesHue } = lookFor(login)
      expect(Math.abs(hairHue)).toBeLessThanOrEqual(0.04)
      expect(Math.abs(clothesHue)).toBeLessThanOrEqual(0.06)
    }
  })
})

describe('materialRole', () => {
  it('recognises skin, face and hair and treats the rest as clothes', () => {
    expect(['Skin', 'Face', 'Hair', 'Moustache', 'Shirt', 'Armor_Dark'].map(materialRole)).toEqual(['skin', 'face', 'hair', 'hair', 'clothes', 'clothes'])
  })
})

describe('idleRhythm', () => {
  it('offsets and speeds each actor differently but within 0.9-1.1', () => {
    const rhythms = ['pr:a#1', 'pr:a#2', 'person:b'].map(idleRhythm)
    for (const { speed, offset } of rhythms) {
      expect(speed).toBeGreaterThanOrEqual(0.9)
      expect(speed).toBeLessThanOrEqual(1.1)
      expect(offset).toBeGreaterThanOrEqual(0)
      expect(offset).toBeLessThan(1)
    }
    expect(new Set(rhythms.map(r => r.offset)).size).toBe(3)
  })
})
