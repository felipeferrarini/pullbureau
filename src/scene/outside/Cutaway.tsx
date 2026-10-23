'use client'

import { useFrame } from '@react-three/fiber'
import { type ReactNode, useRef } from 'react'
import type { Group } from 'three'
import { DYNAMIC } from '../render/batchMeshes'
import { useSkyLook } from '../render/SkyContext'
import { StaticBatch } from '../render/StaticBatch'
import { cutawayLevel } from './cutawayLevel'

const RATE = 5
const HIDDEN = 0.01

// Sims-style walls-down: tall front pieces sink as the camera climbs over the building and rise again at street level.
export function Cutaway({ children, position }: { children: ReactNode; position?: [number, number, number] }) {
  const ref = useRef<Group>(null)
  const level = useRef(1)
  useFrame(({ camera }, delta) => {
    const group = ref.current
    if (!group) return
    const goal = cutawayLevel(camera.position.y)
    level.current += (goal - level.current) * Math.min(1, RATE * delta)
    group.scale.y = Math.max(HIDDEN, level.current)
    group.visible = level.current > HIDDEN
  })
  const { lampsOn, night, phase } = useSkyLook()
  return (
    <group ref={ref} position={position} userData={DYNAMIC}>
      <StaticBatch version={`${lampsOn}|${night}|${phase}`}>{children}</StaticBatch>
    </group>
  )
}
