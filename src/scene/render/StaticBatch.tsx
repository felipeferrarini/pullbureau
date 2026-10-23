'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import type { Group, Mesh, Object3D } from 'three'
import { type Batch, buildBatch, disposeBatch } from './batchMeshes'

const RECHECK_MS = 500

const meshCount = (root: Object3D) => {
  let count = 0
  root.traverse(object => {
    if ((object as Mesh).isMesh && !object.userData.batch) count++
  })
  return count
}

// Draws the static, plain-coloured meshes below it in a handful of draw calls. `version` must change whenever a child's look changes;
// meshes mounting or unmounting (Suspense, conditional parts) are picked up on their own.
export function StaticBatch({ version = '', children }: { version?: string; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    let batch: Batch = buildBatch(root)
    let count = meshCount(root)
    const timer = window.setInterval(() => {
      const now = meshCount(root)
      if (now === count) return
      disposeBatch(batch)
      batch = buildBatch(root)
      count = now
    }, RECHECK_MS)
    return () => {
      window.clearInterval(timer)
      disposeBatch(batch)
    }
  }, [version])
  return <group ref={ref}>{children}</group>
}
