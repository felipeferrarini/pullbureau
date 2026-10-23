'use client'

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { DYNAMIC } from '../render/batchMeshes'
import { useEffect, useMemo, useRef } from 'react'
import type { Group, Object3D } from 'three'
import { getProp } from '@/shared/props'
import type { CarPlan } from '@/types/outside'
import { carPlans, carX } from './city'
import { ROAD_Y } from './street'

const WHEEL_RADIUS = 0.32

function wheelsOf(model: Object3D): Object3D[] {
  const found: Object3D[] = []
  model.traverse(child => {
    if (child.name.startsWith('wheel-')) found.push(child)
  })
  return found
}

function Car({ plan }: { plan: CarPlan }) {
  const { scene } = useGLTF(getProp(plan.model).file)
  const body = useRef<Group>(null)
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse(child => {
      child.castShadow = true
    })
    return clone
  }, [scene])
  const wheels = useRef<Object3D[]>([])
  useEffect(() => {
    wheels.current = wheelsOf(model)
  }, [model])

  useFrame(({ clock }, delta) => {
    if (body.current) body.current.position.x = carX(plan, clock.elapsedTime)
    const spin = (plan.speed * delta) / WHEEL_RADIUS
    for (const wheel of wheels.current) wheel.rotateX(spin)
  })

  return (
    <group ref={body} position={[carX(plan, 0), ROAD_Y, plan.lane.z]} rotation-y={(plan.lane.direction * Math.PI) / 2}>
      <primitive object={model} />
    </group>
  )
}

export function Cars() {
  const plans = useMemo(() => carPlans(), [])
  return (
    <group userData={DYNAMIC}>
      {plans.map(plan => (
        <Car key={plan.id} plan={plan} />
      ))}
    </group>
  )
}
