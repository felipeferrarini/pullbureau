import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { describe, expect, it } from 'vitest'
import { DYNAMIC, buildBatch, disposeBatch } from './batchMeshes'

const box = (color: string, x: number, extra: Partial<MeshStandardMaterial> = {}) => {
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color, ...extra }))
  mesh.position.x = x
  return mesh
}

describe('buildBatch', () => {
  it('merges plain meshes that only differ by colour into one draw', () => {
    const root = new Group()
    root.position.set(10, 0, 0)
    const parts = [box('#ff0000', 0), box('#00ff00', 2), box('#0000ff', 4)]
    root.add(...parts)
    const batch = buildBatch(root)
    expect(batch.meshes).toHaveLength(1)
    expect(parts.every(part => !part.visible && !part.matrixAutoUpdate)).toBe(true)
    const geometry = batch.meshes[0].geometry
    expect(geometry.attributes.position.count).toBe(72)
    expect(geometry.attributes.color.getX(0)).toBeCloseTo(1)
    expect(geometry.attributes.color.getY(30)).toBeCloseTo(1)
    geometry.computeBoundingBox()
    expect(geometry.boundingBox?.max.x).toBeCloseTo(4.5)
  })

  it('keeps animated, see-through and textured-looking parts on their own', () => {
    const root = new Group()
    const animated = box('#ff0000', 0)
    animated.userData = DYNAMIC
    const glass = box('#ffffff', 1, { transparent: true, opacity: 0.2 })
    const shiny = box('#ffffff', 2, { metalness: 0.8 })
    const almostMatte = box('#444444', 5, { roughness: 0.97 })
    root.add(animated, glass, shiny, box('#222222', 3), box('#333333', 4), almostMatte)
    const batch = buildBatch(root)
    expect(batch.meshes).toHaveLength(1)
    expect([animated, glass, shiny].every(part => part.visible)).toBe(true)
    expect(almostMatte.visible).toBe(false)
  })

  it('puts everything back when disposed', () => {
    const root = new Group()
    const parts = [box('#ff0000', 0), box('#00ff00', 2)]
    root.add(...parts)
    const batch = buildBatch(root)
    disposeBatch(batch)
    expect(root.children).toHaveLength(2)
    expect(parts.every(part => part.visible && part.matrixAutoUpdate)).toBe(true)
  })
})
