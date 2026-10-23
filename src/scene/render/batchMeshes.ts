import { BufferAttribute, BufferGeometry, Matrix4, Mesh, MeshStandardMaterial } from 'three'
import type { Material, Object3D } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const DYNAMIC = { dynamic: true }

const KEPT_ATTRIBUTES = ['position', 'normal']

const isDynamic = (object: Object3D) => {
  for (let node: Object3D | null = object; node; node = node.parent) if (node.userData.dynamic) return true
  return false
}

function batchable(object: Object3D): object is Mesh {
  const mesh = object as Mesh
  if (!mesh.isMesh || (mesh as { isInstancedMesh?: boolean }).isInstancedMesh || (mesh as { isSkinnedMesh?: boolean }).isSkinnedMesh) return false
  if (!mesh.visible || mesh.renderOrder !== 0 || Array.isArray(mesh.material)) return false
  const geometry = mesh.geometry as BufferGeometry & { isInstancedBufferGeometry?: boolean }
  if (geometry.isInstancedBufferGeometry || !geometry.attributes.position || !geometry.attributes.normal || geometry.morphAttributes.position) return false
  const material = mesh.material as MeshStandardMaterial
  if (material.type !== 'MeshStandardMaterial' || material.vertexColors || material.transparent || material.opacity < 1 || material.alphaTest > 0) return false
  if (material.map || material.emissiveMap || material.normalMap || material.roughnessMap || material.metalnessMap || material.alphaMap || material.aoMap) return false
  return !isDynamic(mesh)
}

// Roughness and metalness are snapped to tenths so near-identical looks share a draw call.
const snap = (value: number) => Math.round(value * 10) / 10

function signature(mesh: Mesh): string {
  const m = mesh.material as MeshStandardMaterial
  return [snap(m.roughness), snap(m.metalness), m.emissive.getHexString(), m.emissiveIntensity, m.side, m.flatShading, m.toneMapped, m.fog, m.depthWrite, mesh.castShadow, mesh.receiveShadow, mesh.geometry.index ? 1 : 0].join('|')
}

function bakedPart(mesh: Mesh, toRoot: Matrix4): BufferGeometry {
  const part = new BufferGeometry()
  for (const name of KEPT_ATTRIBUTES) part.setAttribute(name, mesh.geometry.attributes[name].clone())
  if (mesh.geometry.index) part.setIndex(mesh.geometry.index.clone())
  part.applyMatrix4(new Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld))
  const { r, g, b } = (mesh.material as MeshStandardMaterial).color
  const count = part.attributes.position.count
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count * 3; i += 3) {
    colors[i] = r
    colors[i + 1] = g
    colors[i + 2] = b
  }
  part.setAttribute('color', new BufferAttribute(colors, 3))
  return part
}

function batchMaterial(source: MeshStandardMaterial): Material {
  return new MeshStandardMaterial({
    vertexColors: true,
    roughness: snap(source.roughness),
    metalness: snap(source.metalness),
    emissive: source.emissive,
    emissiveIntensity: source.emissiveIntensity,
    side: source.side,
    flatShading: source.flatShading,
    toneMapped: source.toneMapped,
    fog: source.fog,
    depthWrite: source.depthWrite,
  })
}

export type Batch = { meshes: Mesh[]; hidden: Mesh[] }

// Merges the plain, untextured, opaque meshes under `root` into one mesh per material look (colour goes to vertex colours) and hides the originals.
// Originals stay in the tree, so clicks and React keep working; anything under userData.dynamic is left alone.
export function buildBatch(root: Object3D, minParts = 2): Batch {
  root.updateWorldMatrix(true, true)
  const toRoot = root.matrixWorld.clone().invert()
  const groups = new Map<string, Mesh[]>()
  root.traverse(object => {
    if (object === root || !batchable(object)) return
    const key = signature(object)
    groups.set(key, [...(groups.get(key) ?? []), object])
  })
  const meshes: Mesh[] = []
  const hidden: Mesh[] = []
  for (const sources of groups.values()) {
    if (sources.length < minParts) continue
    const geometry = mergeGeometries(sources.map(source => bakedPart(source, toRoot)))
    if (!geometry) continue
    geometry.computeBoundingSphere()
    const first = sources[0]
    const mesh = new Mesh(geometry, batchMaterial(first.material as MeshStandardMaterial))
    mesh.castShadow = first.castShadow
    mesh.receiveShadow = first.receiveShadow
    mesh.matrixAutoUpdate = false
    mesh.raycast = () => {}
    mesh.userData.batch = true
    for (const source of sources) {
      source.visible = false
      source.matrixAutoUpdate = false
    }
    hidden.push(...sources)
    meshes.push(mesh)
  }
  for (const mesh of meshes) root.add(mesh)
  return { meshes, hidden }
}

export function disposeBatch({ meshes, hidden }: Batch) {
  for (const mesh of meshes) {
    mesh.removeFromParent()
    mesh.geometry.dispose()
    ;(mesh.material as Material).dispose()
  }
  for (const source of hidden) {
    source.visible = true
    source.matrixAutoUpdate = true
  }
}
