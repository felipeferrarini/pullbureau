'use client'

import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { useAppStore } from '@/client/store'
import { isBrawl } from '@/domain/queue'
import type { Counter } from '@/types/domain'
import { brawlFrameAt } from './brawlCloud'
import { FRAME_H, FRAME_W, brawlAtlas, showFrame } from './brawlTexture'
import { COUNTER_Z, counterX } from './layout'
import { isDragRelease } from './pointer'
import { DYNAMIC } from './render/batchMeshes'
import { useReducedMotion } from './render/useReducedMotion'

const WIDTH = 2.8
const HEIGHT = (WIDTH * FRAME_H) / FRAME_W
const CLOUD_Y = 3
const CLOUD_Z = COUNTER_Z + 1.2
const SHAKE = 0.035
const TILT = 0.05

// A comic dust-cloud brawl over the queue: one billboarded quad flipping through a drawn atlas.
export function FightCloud({ counter, index, count }: { counter: Counter; index: number; count: number }) {
  const brawl = counter.queue.filter(isBrawl).sort((a, b) => b.discussion.messages - a.discussion.messages)[0]
  const shaker = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const openDuel = useAppStore(state => state.openDuel)
  const reduced = useReducedMotion()
  const atlas = useMemo(() => (brawl ? brawlAtlas(brawl.number) : null), [brawl])
  const x = counterX(index, count)

  useFrame(({ clock }) => {
    const group = shaker.current
    if (!group || !atlas) return
    const t = clock.elapsedTime
    showFrame(atlas, brawlFrameAt(t, reduced))
    if (reduced) return
    group.position.set(Math.sin(t * 23) * SHAKE, Math.sin(t * 31) * SHAKE * 0.6, 0)
    group.rotation.set(0, 0, Math.sin(t * 9) * TILT)
  })

  if (!brawl || !atlas) return null
  return (
    <Billboard position={[x, CLOUD_Y, CLOUD_Z]} userData={DYNAMIC}>
      <group
        ref={shaker}
        scale={hovered ? 1.12 : 1}
        onClick={event => {
          event.stopPropagation()
          if (isDragRelease(event)) return
          openDuel({ repo: brawl.repo, number: brawl.number })
        }}
        onPointerOver={event => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = ''
        }}
      >
        <mesh renderOrder={4}>
          <planeGeometry args={[WIDTH, HEIGHT]} />
          <meshBasicMaterial map={atlas} transparent alphaTest={0.02} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </Billboard>
  )
}
