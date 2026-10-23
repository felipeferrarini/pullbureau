import { Bone, BoxGeometry, Color, Group, MeshStandardMaterial, Skeleton, SkinnedMesh, Uint16BufferAttribute } from 'three'
import { describe, expect, it } from 'vitest'
import { fuseBody, mergedBody, paintBody, partColor, vertexRanges } from './characterBody'

const LOOK = { skin: '#8a5a3a', hairHue: 0, clothesHue: 0 }

function part(name: string, color: string, bones: Bone[], skeleton: Skeleton) {
  const geometry = new BoxGeometry(1, 1, 1)
  geometry.deleteAttribute('uv')
  const count = geometry.attributes.position.count
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4))
  geometry.setAttribute('skinWeight', new Uint16BufferAttribute(new Uint16Array(count * 4).fill(1), 4))
  const mesh = new SkinnedMesh(geometry, new MeshStandardMaterial({ name, color }))
  mesh.add(bones[0])
  mesh.bind(skeleton)
  mesh.remove(bones[0])
  return mesh
}

function character(names: [string, string][]) {
  const root = new Group()
  const body = new Group()
  const bones = [new Bone()]
  const skeleton = new Skeleton(bones)
  root.add(bones[0], body)
  for (const [name, color] of names) body.add(part(name, color, bones, skeleton))
  return root
}

describe('vertexRanges', () => {
  it('lays parts end to end', () => {
    expect(vertexRanges([3, 5, 2])).toEqual([
      { start: 0, count: 3 },
      { start: 3, count: 5 },
      { start: 8, count: 2 },
    ])
  })
})

describe('partColor', () => {
  it('paints skin with the person tone and leaves the face alone', () => {
    expect(partColor('Skin', new Color('#ffffff'), LOOK, 0).getHexString()).toBe('8a5a3a')
    expect(partColor('Face', new Color('#fffff8'), LOOK, 0).getHexString()).toBe('fffff8')
  })

  it('greys out dusty clothes', () => {
    const clean = partColor('Shirt', new Color('#c0392b'), LOOK, 0)
    const dusty = partColor('Shirt', new Color('#c0392b'), LOOK, 0.62)
    expect(dusty.getHSL({ h: 0, s: 0, l: 0 }).s).toBeLessThan(clean.getHSL({ h: 0, s: 0, l: 0 }).s)
  })
})

describe('mergedBody', () => {
  it('merges flat coloured parts that share a skeleton into one geometry', () => {
    const scene = character([
      ['Skin', '#ffffff'],
      ['Shirt', '#2255aa'],
      ['Hair', '#553311'],
    ])
    const body = mergedBody(scene)
    expect(body?.parts.map(p => p.name)).toEqual(['Skin', 'Shirt', 'Hair'])
    expect(body?.geometry.attributes.position.count).toBe(72)
    expect(mergedBody(scene)).toBe(body)
  })

  it('refuses textured parts', () => {
    const scene = character([
      ['Skin', '#ffffff'],
      ['Shirt', '#2255aa'],
    ])
    scene.traverse(child => {
      if ((child as SkinnedMesh).isSkinnedMesh) ((child as SkinnedMesh).material as MeshStandardMaterial).transparent = true
    })
    expect(mergedBody(scene)).toBeNull()
  })

  it('paints each part with its own colour and shares the rest of the geometry', () => {
    const body = mergedBody(character([['Skin', '#ffffff'], ['Shirt', '#2255aa']]))!
    const painted = paintBody(body, LOOK, 0)
    const color = painted.attributes.color
    const skin = new Color(LOOK.skin)
    expect(color.getX(0)).toBeCloseTo(skin.r, 3)
    expect(color.getZ(30)).toBeCloseTo(new Color('#2255aa').b, 3)
    expect(painted.attributes.position).toBe(body.geometry.attributes.position)
  })

  it('leaves one skinned mesh per character with a shared material', () => {
    const source = character([['Skin', '#ffffff'], ['Shirt', '#2255aa']])
    const body = mergedBody(source)!
    const a = fuseBody(character([['Skin', '#ffffff'], ['Shirt', '#2255aa']]), body, LOOK, 0)
    const b = fuseBody(character([['Skin', '#ffffff'], ['Shirt', '#2255aa']]), body, { ...LOOK, skin: '#f3d2b8' }, 0)
    expect(a).toHaveLength(1)
    expect(a[0].material).toBe(b[0].material)
  })
})
