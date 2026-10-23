import { BufferGeometry, Color, Matrix4, MeshStandardMaterial, SRGBColorSpace, Uint16BufferAttribute } from 'three'
import type { Material, Mesh, Object3D, Side, SkinnedMesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { BodyPart, CharacterLook, MergedBody, VertexRange } from '@/types/scene'
import { materialRole } from './characterLook'

const DUST_COLOR = new Color('#b9b2a3')
const MIN_CLOTHES_LIGHTNESS = 0.2
const ROUGHNESS = 0.75
const COLOR_MAX = 65535
const IDENTITY = new Matrix4()
const hsl = { h: 0, s: 0, l: 0 }

export function vertexRanges(counts: number[]): VertexRange[] {
  let start = 0
  return counts.map(count => {
    const range = { start, count }
    start += count
    return range
  })
}

function shiftHue(color: Color, hue: number, minLightness = 0) {
  color.getHSL(hsl, SRGBColorSpace)
  color.setHSL((hsl.h + hue + 1) % 1, hsl.s, Math.max(minLightness, hsl.l), SRGBColorSpace)
}

export function partColor(name: string, base: Color, look: CharacterLook, dust: number): Color {
  const color = base.clone()
  const role = materialRole(name)
  if (role === 'skin') color.set(look.skin)
  if (role === 'hair') shiftHue(color, look.hairHue)
  if (role === 'clothes') shiftHue(color, look.clothesHue, MIN_CLOTHES_LIGHTNESS)
  if (dust > 0) color.lerp(DUST_COLOR, dust)
  return color
}

export function restyleMaterial(material: Material, look: CharacterLook, dust: number): Material {
  const copy = material.clone() as MeshStandardMaterial
  if (!copy.color) return copy
  copy.color.copy(partColor(copy.name, copy.color, look, dust))
  copy.roughness = ROUGHNESS
  copy.metalness = 0
  return copy
}

const skinnedMeshes = (root: Object3D): SkinnedMesh[] => {
  const meshes: SkinnedMesh[] = []
  root.traverse(child => {
    if ((child as SkinnedMesh).isSkinnedMesh) meshes.push(child as SkinnedMesh)
  })
  return meshes
}

const plainMaterial = (mesh: SkinnedMesh): MeshStandardMaterial | null => {
  const material = mesh.material
  if (Array.isArray(material) || !(material as MeshStandardMaterial).isMeshStandardMaterial) return null
  const standard = material as MeshStandardMaterial
  return standard.map || standard.transparent || standard.emissiveMap ? null : standard
}

const attributeKey = (geometry: BufferGeometry) => Object.keys(geometry.attributes).sort().join()

function mergeable(meshes: SkinnedMesh[]): boolean {
  const [first] = meshes
  if (!first) return false
  const bones = first.skeleton.bones
  const parent = first.parent
  const key = attributeKey(first.geometry)
  return meshes.every(
    mesh =>
      mesh.parent === parent &&
      mesh.matrix.equals(IDENTITY) &&
      mesh.bindMatrix.equals(first.bindMatrix) &&
      mesh.skeleton.bones.length === bones.length &&
      mesh.skeleton.bones.every((bone, i) => bone === bones[i]) &&
      mesh.geometry.index !== null &&
      attributeKey(mesh.geometry) === key &&
      plainMaterial(mesh) !== null &&
      plainMaterial(mesh)?.side === plainMaterial(first)?.side,
  )
}

const merged = new WeakMap<Object3D, MergedBody | null>()

// All parts of a character share one skeleton and differ only by a flat colour, so they can be one draw call.
export function mergedBody(scene: Object3D): MergedBody | null {
  if (merged.has(scene)) return merged.get(scene) ?? null
  const meshes = skinnedMeshes(scene)
  let body: MergedBody | null = null
  if (meshes.length > 1 && mergeable(meshes)) {
    const geometry = mergeGeometries(meshes.map(mesh => mesh.geometry))
    const ranges = vertexRanges(meshes.map(mesh => mesh.geometry.attributes.position.count))
    const parts: BodyPart[] = meshes.map((mesh, i) => {
      const material = plainMaterial(mesh) as MeshStandardMaterial
      return { name: material.name, color: material.color.clone(), ...ranges[i] }
    })
    body = geometry ? { geometry, parts, side: (meshes[0].material as Material).side } : null
  }
  merged.set(scene, body)
  return body
}

export function paintBody(body: MergedBody, look: CharacterLook, dust: number): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setIndex(body.geometry.index)
  for (const [name, attribute] of Object.entries(body.geometry.attributes)) geometry.setAttribute(name, attribute)
  const colors = new Uint16Array(body.geometry.attributes.position.count * 3)
  for (const part of body.parts) {
    const { r, g, b } = partColor(part.name, part.color, look, dust)
    for (let i = part.start * 3; i < (part.start + part.count) * 3; i += 3) {
      colors[i] = r * COLOR_MAX
      colors[i + 1] = g * COLOR_MAX
      colors[i + 2] = b * COLOR_MAX
    }
  }
  geometry.setAttribute('color', new Uint16BufferAttribute(colors, 3, true))
  return geometry
}

const materials = new Map<Side, MeshStandardMaterial>()
const shared = new Set<Material>()

export function bodyMaterial(side: MergedBody['side']): MeshStandardMaterial {
  let material = materials.get(side)
  if (!material) {
    material = new MeshStandardMaterial({ vertexColors: true, roughness: ROUGHNESS, metalness: 0, side, name: 'CharacterBody' })
    materials.set(side, material)
    shared.add(material)
  }
  return material
}

export function dressMeshes(object: Object3D, look: CharacterLook, dust: number): Mesh[] {
  const meshes: Mesh[] = []
  object.traverse(child => {
    const mesh = child as Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(m => restyleMaterial(m, look, dust))
    else if (!shared.has(mesh.material)) mesh.material = restyleMaterial(mesh.material, look, dust)
    meshes.push(mesh)
  })
  return meshes
}

// Keeps the first skinned mesh of a cloned character, painted with every part, and drops the rest.
export function fuseBody(copy: Object3D, body: MergedBody, look: CharacterLook, dust: number): Mesh[] {
  const [first, ...rest] = skinnedMeshes(copy)
  if (!first) return []
  for (const mesh of rest) mesh.removeFromParent()
  first.geometry = paintBody(body, look, dust)
  first.material = bodyMaterial(body.side)
  first.computeBoundingBox()
  first.computeBoundingSphere()
  return dressMeshes(copy, look, dust)
}
