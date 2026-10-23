'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, Color, type InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three'
import type { Actor } from '@/types/scene'
import { actorObject } from './actorRegistry'
import { PULL_FROM, seatOf, stoolColor, stoolPose } from './seat'
import { stoolPhase } from './stoolRegistry'

const TOP = 0.035
const HALF = 0.15
const LEG = 0.032
const SPLAY = 0.03
const BAR_AT = 0.38
const LEGS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
const BARS: [number, number, boolean][] = [[0, 1, true], [0, -1, true], [1, 0, false], [-1, 0, false]]

const box = new BoxGeometry(1, 1, 1)
const hidden = new Matrix4().makeScale(0, 0, 0)
const base = new Matrix4()
const part = new Matrix4()
const position = new Vector3()
const turn = new Quaternion()
const tilt = new Quaternion()
const size = new Vector3()
const up = new Vector3(0, 1, 0)
const axis = new Vector3()

type Sitter = { id: string; height: number; back: number; color: Color }

function placeStool(stool: Sitter, now: number): boolean {
  const object = actorObject(stool.id)
  const phase = stoolPhase(stool.id)
  if (!object || !phase) return false
  const pose = stoolPose(phase, now)
  if (pose.scale <= 0) return false
  const yaw = object.rotation.y
  const behind = -(stool.back + pose.slide * PULL_FROM)
  position.set(object.position.x + Math.sin(yaw) * behind, object.position.y, object.position.z + Math.cos(yaw) * behind)
  base.compose(position, turn.setFromAxisAngle(up, yaw), size.setScalar(pose.scale))
  return true
}

function writeTop(mesh: InstancedMesh, i: number, stool: Sitter) {
  part.compose(position.set(0, stool.height - TOP / 2, 0), turn.identity(), size.set(HALF * 2, TOP, HALF * 2))
  mesh.setMatrixAt(i, part.premultiply(base))
}

function writeLegs(mesh: InstancedMesh, i: number, stool: Sitter) {
  const legHeight = stool.height - TOP
  LEGS.forEach(([sx, sz], k) => {
    axis.set(sz, 0, -sx).normalize()
    tilt.setFromAxisAngle(axis, -Math.atan2(SPLAY, legHeight))
    part.compose(position.set(sx * (HALF - 0.02), legHeight / 2, sz * (HALF - 0.02)), tilt, size.set(LEG, legHeight, LEG))
    mesh.setMatrixAt(i * 4 + k, part.premultiply(base))
  })
}

function writeBars(mesh: InstancedMesh, i: number, stool: Sitter) {
  const y = (stool.height - TOP) * BAR_AT
  const reach = HALF - 0.02 + SPLAY * (1 - BAR_AT)
  BARS.forEach(([sx, sz, alongX], k) => {
    part.compose(position.set(sx * reach, y, sz * reach), turn.identity(), size.set(alongX ? reach * 2 : 0.02, 0.025, alongX ? 0.02 : reach * 2))
    mesh.setMatrixAt(i * 4 + k, part.premultiply(base))
  })
}

function paint(mesh: InstancedMesh | null, stools: Sitter[], per: number) {
  if (!mesh) return
  stools.forEach((stool, i) => {
    for (let k = 0; k < per; k++) mesh.setColorAt(i * per + k, stool.color)
  })
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

// Plastic market stools under every seated queue customer, pulled in when they sit and folded when they stand.
export function Stools({ actors }: { actors: Actor[] }) {
  const stools = useMemo<Sitter[]>(
    () => actors.filter(actor => actor.kind === 'customer' && actor.anim === 'sit').map(actor => ({ id: actor.id, ...seatOf(actor.modelId), color: new Color(stoolColor(actor.id)) })),
    [actors],
  )
  const tops = useRef<InstancedMesh>(null)
  const legs = useRef<InstancedMesh>(null)
  const bars = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    paint(tops.current, stools, 1)
    paint(legs.current, stools, 4)
    paint(bars.current, stools, 4)
  }, [stools])

  useFrame(({ clock }) => {
    const [top, leg, bar] = [tops.current, legs.current, bars.current]
    if (!top || !leg || !bar) return
    stools.forEach((stool, i) => {
      if (placeStool(stool, clock.elapsedTime)) {
        writeTop(top, i, stool)
        writeLegs(leg, i, stool)
        writeBars(bar, i, stool)
        return
      }
      top.setMatrixAt(i, hidden)
      for (let k = 0; k < 4; k++) {
        leg.setMatrixAt(i * 4 + k, hidden)
        bar.setMatrixAt(i * 4 + k, hidden)
      }
    })
    top.instanceMatrix.needsUpdate = true
    leg.instanceMatrix.needsUpdate = true
    bar.instanceMatrix.needsUpdate = true
  })

  if (!stools.length) return null
  return (
    <group>
      <instancedMesh key={`t${stools.length}`} ref={tops} args={[box, undefined, stools.length]} frustumCulled={false} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
      <instancedMesh key={`l${stools.length}`} ref={legs} args={[box, undefined, stools.length * 4]} frustumCulled={false} castShadow>
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
      <instancedMesh key={`b${stools.length}`} ref={bars} args={[box, undefined, stools.length * 4]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
    </group>
  )
}
