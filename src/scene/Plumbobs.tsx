'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, Color, EdgesGeometry, InstancedBufferAttribute, LineBasicMaterial, Matrix4, MeshStandardMaterial, OctahedronGeometry, Vector3 } from 'three'
import type { InstancedMesh, LineSegments } from 'three'
import { plumbobCount, plumbobEntries } from './plumbobRegistry'

const SIZE = 0.082
export const STRETCH = 1.85
export const PLUMBOB_SHAPE = new OctahedronGeometry(SIZE, 0)
const EDGE_POINTS = new EdgesGeometry(PLUMBOB_SHAPE, 1).attributes.position
const MAX = 400
const stretch = new Matrix4().makeScale(1, STRETCH, 1)
const matrix = new Matrix4()
const point = new Vector3()
const glow = new Color()

// Emissive per instance: the glow follows each PR's CI colour and pulse.
function crystalMaterial() {
  const material = new MeshStandardMaterial({ roughness: 0.25, metalness: 0.1, flatShading: true })
  material.onBeforeCompile = shader => {
    shader.vertexShader = `attribute vec3 instanceEmissive;\nvarying vec3 vInstanceEmissive;\n${shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvInstanceEmissive = instanceEmissive;')}`
    shader.fragmentShader = `varying vec3 vInstanceEmissive;\n${shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance = vInstanceEmissive;')}`
  }
  material.customProgramCacheKey = () => 'plumbob-crystal'
  return material
}

function crystalGeometry() {
  const geometry = PLUMBOB_SHAPE.clone()
  geometry.setAttribute('instanceEmissive', new InstancedBufferAttribute(new Float32Array(MAX * 3), 3))
  return geometry
}

function edgeGeometry() {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(MAX * EDGE_POINTS.count * 3), 3))
  geometry.setDrawRange(0, 0)
  return geometry
}

// Every plumbob in the hall in two draw calls: the crystals instanced, their edges in one line batch.
export function Plumbobs() {
  const crystals = useRef<InstancedMesh>(null)
  const edges = useRef<LineSegments>(null)
  const material = useMemo(() => crystalMaterial(), [])
  const edgeMaterial = useMemo(() => new LineBasicMaterial({ color: '#fffbe8', transparent: true, opacity: 0.55 }), [])
  const geometry = useMemo(() => edgeGeometry(), [])
  const shape = useMemo(() => crystalGeometry(), [])

  useFrame(() => {
    const mesh = crystals.current
    const lines = edges.current
    if (!mesh || !lines) return
    const positions = lines.geometry.attributes.position as BufferAttribute
    let i = 0
    for (const entry of plumbobEntries()) {
      if (i >= MAX) break
      entry.anchor.updateWorldMatrix(true, false)
      matrix.multiplyMatrices(entry.anchor.matrixWorld, stretch)
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, entry.color)
      glow.copy(entry.color).multiplyScalar(entry.emissive)
      mesh.geometry.attributes.instanceEmissive.setXYZ(i, glow.r, glow.g, glow.b)
      for (let v = 0; v < EDGE_POINTS.count; v++) {
        point.fromBufferAttribute(EDGE_POINTS, v).applyMatrix4(matrix)
        positions.setXYZ(i * EDGE_POINTS.count + v, point.x, point.y, point.z)
      }
      i++
    }
    mesh.count = i
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.geometry.attributes.instanceEmissive.needsUpdate = true
    positions.needsUpdate = true
    lines.geometry.setDrawRange(0, i * EDGE_POINTS.count)
  })

  return (
    <>
      <instancedMesh ref={crystals} args={[shape, material, MAX]} count={plumbobCount()} frustumCulled={false} />
      <lineSegments ref={edges} geometry={geometry} material={edgeMaterial} frustumCulled={false} />
    </>
  )
}
