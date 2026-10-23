'use client'

import { useGLTF } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { type BufferGeometry, type InstancedMesh, type Material, Matrix4, type Mesh, type MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { getProp } from '@/shared/props'
import type { PropPlacement } from '@/types/scene'

type Part = { geometry: BufferGeometry; material: Material | Material[]; matrix: Matrix4 }

const UP = new Vector3(0, 1, 0)

export function placementMatrix({ position, rotation = 0, scale = 1 }: PropPlacement, target = new Matrix4()) {
  return target.compose(new Vector3(...position), new Quaternion().setFromAxisAngle(UP, rotation), new Vector3(scale, scale, scale))
}

export type PropColors = Record<string, string>

function recolor(material: Material, colors: PropColors | undefined): Material {
  const color = colors?.[material.name]
  if (!color) return material
  const copy = material.clone() as MeshStandardMaterial
  copy.color.set(color)
  return copy
}

function useParts(id: string, colors?: PropColors): Part[] {
  const { scene } = useGLTF(getProp(id).file)
  const key = JSON.stringify(colors ?? {})
  return useMemo(() => {
    scene.updateMatrixWorld(true)
    const parts: Part[] = []
    scene.traverse(child => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const material = Array.isArray(mesh.material) ? mesh.material.map(m => recolor(m, colors)) : recolor(mesh.material, colors)
      parts.push({ geometry: mesh.geometry, material, matrix: mesh.matrixWorld.clone() })
    })
    return parts
  }, [scene, key]) // eslint-disable-line react-hooks/exhaustive-deps
}

function PartInstances({ part, placements, shadows }: { part: Part; placements: PropPlacement[]; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4()
    placements.forEach((placement, i) => mesh.setMatrixAt(i, placementMatrix(placement, matrix).multiply(part.matrix)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [part, placements])
  return <instancedMesh key={placements.length} ref={ref} args={[part.geometry, part.material, placements.length]} castShadow={shadows} receiveShadow />
}

type InstancedPropProps = { id: string; placements: PropPlacement[]; shadows?: boolean; colors?: PropColors }

export function InstancedProp({ id, placements, shadows = true, colors }: InstancedPropProps) {
  const parts = useParts(id, colors)
  if (!placements.length) return null
  return (
    <group>
      {parts.map((part, i) => (
        <PartInstances key={i} part={part} placements={placements} shadows={shadows} />
      ))}
    </group>
  )
}

type SinglePropProps = PropPlacement & { id: string; shadows?: boolean; colors?: PropColors }

export function SingleProp({ id, shadows = true, colors, position, rotation, scale }: SinglePropProps) {
  const placements = useMemo(() => [{ position, rotation, scale }], [position[0], position[1], position[2], rotation, scale]) // eslint-disable-line react-hooks/exhaustive-deps
  return <InstancedProp id={id} placements={placements} shadows={shadows} colors={colors} />
}
