'use client'

import { useFrame } from '@react-three/fiber'
import { StaticBatch } from './render/StaticBatch'
import { useMemo, useRef } from 'react'
import { CanvasTexture, DoubleSide, Euler, type Group, type Mesh, Quaternion, SRGBColorSpace, Vector3 } from 'three'
import type { CobwebLook } from '@/types/scene'
import { useReducedMotion } from './render/useReducedMotion'

const TEXTURE = 256
const PAD = 6
const SMALL = 0.38
const LARGE = 0.52
const TWIN = 0.32
const CORNER_X = 0.3
const CORNER_Y = 0
const WEB_Z = -0.3
const LEAN = 0.5
const SILK = '#f2efe8'
const SPOKES = 6
const RINGS = 5

// Deterministic jitter so the web looks hand-spun without flickering between renders.
const wobble = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5

const spokeAngles = () => Array.from({ length: SPOKES }, (_, i) => ((Math.PI / 2) * i) / (SPOKES - 1) + (i % (SPOKES - 1) ? wobble(i, 1) * 0.12 : 0))

// A corner web: anchor threads along the head and the shoulder, spokes from the corner and sagging rings.
function spin(ctx: CanvasRenderingContext2D) {
  const origin: [number, number] = [PAD, TEXTURE - PAD]
  const radius = TEXTURE - PAD * 2
  const angles = spokeAngles()
  const at = (angle: number, r: number): [number, number] => [origin[0] + Math.cos(angle) * r, origin[1] - Math.sin(angle) * r]
  ctx.beginPath()
  angles.forEach((angle, i) => {
    ctx.moveTo(...origin)
    ctx.lineTo(...at(angle, radius * (0.82 + wobble(i, 2) * 0.3)))
  })
  for (let ring = 1; ring <= RINGS; ring++) {
    const r = radius * (0.14 + (0.66 * ring) / RINGS) * (1 + wobble(ring, 3) * 0.08)
    ctx.moveTo(...at(angles[0], r))
    for (let i = 1; i < angles.length; i++) {
      if ((ring * 5 + i * 3) % 11 === 0) {
        ctx.moveTo(...at(angles[i], r))
        continue
      }
      const mid = (angles[i - 1] + angles[i]) / 2
      ctx.quadraticCurveTo(...at(mid, r * 0.88), ...at(angles[i], r))
    }
  }
  ctx.moveTo(...at(angles[1], radius * 0.9))
  ctx.quadraticCurveTo(...at(Math.PI * 0.3, radius * 1.02), ...at(angles[3], radius * 0.95))
}

// A faint dusty sheet in the corner so the web still reads as a light tuft from far away.
function sheet(ctx: CanvasRenderingContext2D) {
  const radius = (TEXTURE - PAD * 2) * 0.85
  const gradient = ctx.createRadialGradient(PAD, TEXTURE - PAD, 0, PAD, TEXTURE - PAD, radius)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(PAD, TEXTURE - PAD)
  ctx.arc(PAD, TEXTURE - PAD, radius, -Math.PI / 2, 0)
  ctx.closePath()
  ctx.fill()
}

function drawWeb(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE
  canvas.height = TEXTURE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (ctx) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    sheet(ctx)
    spin(ctx)
    ctx.strokeStyle = 'rgba(70, 72, 84, 0.22)'
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.lineWidth = 3.6
    ctx.stroke()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

let shared: CanvasTexture | null = null
const webTexture = () => (shared ??= drawWeb())

function WebPlane({ texture, size, side }: { texture: CanvasTexture; size: number; side: 1 | -1 }) {
  return (
    <mesh position={[side * (CORNER_X + size / 2), CORNER_Y + (size / 2) * Math.cos(LEAN), WEB_Z + (size / 2) * Math.sin(LEAN)]} rotation-x={LEAN} scale={[side, 1, 1]} renderOrder={3}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} color={SILK} transparent opacity={0.9} depthWrite={false} side={DoubleSide} />
    </mesh>
  )
}

const THREAD = 0.2
const FORWARD = new Vector3(0, 0, 1)
const sway = new Quaternion()

function Spider({ reduced }: { reduced: boolean }) {
  const swing = useRef<Group>(null)
  const thread = useRef<Mesh>(null)
  const body = useRef<Group>(null)
  const anchor: [number, number, number] = [CORNER_X + LARGE * 0.72, CORNER_Y + LARGE * 0.5 * Math.cos(LEAN), WEB_Z + LARGE * 0.5 * Math.sin(LEAN)]
  useFrame(({ clock }) => {
    const hanger = swing.current
    if (!hanger?.parent || !thread.current || !body.current) return
    const t = reduced ? 0 : clock.elapsedTime
    const length = THREAD * (0.8 + Math.sin(t * 1.5) * 0.2)
    thread.current.scale.set(1, length / THREAD, 1)
    thread.current.position.set(0, -length / 2, 0)
    body.current.position.set(0, -length - 0.02, 0)
    hanger.parent.getWorldQuaternion(hanger.quaternion).invert().multiply(sway.setFromAxisAngle(FORWARD, Math.sin(t * 0.8) * 0.12))
  })
  return (
    <group position={anchor}>
      <group ref={swing}>
        <mesh ref={thread} position={[0, -THREAD / 2, 0]}>
          <cylinderGeometry args={[0.003, 0.003, THREAD, 3]} />
          <meshBasicMaterial color={SILK} transparent opacity={0.8} />
        </mesh>
        <group ref={body} position={[0, -THREAD - 0.02, 0]}>
          <StaticBatch>
            <mesh scale={[1, 1.15, 0.9]}>
              <sphereGeometry args={[0.03, 8, 6]} />
              <meshStandardMaterial color="#1d1b22" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.035, 0]}>
              <sphereGeometry args={[0.018, 6, 5]} />
              <meshStandardMaterial color="#2b2830" roughness={0.5} />
            </mesh>
            {[-1, 1].flatMap(side =>
              [0.5, 0.15, -0.2, -0.55].map(lift => (
                <mesh key={`${side}${lift}`} position={[side * 0.038, 0.01 + lift * 0.03, 0]} rotation-z={side * (0.5 + lift)}>
                  <boxGeometry args={[0.06, 0.007, 0.007]} />
                  <meshStandardMaterial color="#1d1b22" roughness={0.5} />
                </mesh>
              )),
            )}
          </StaticBatch>
        </group>
      </group>
    </group>
  )
}

const UP = new Vector3(0, 1, 0)
const headTurn = new Quaternion()
const heading = new Euler(0, 0, 0, 'YXZ')
const yaw = new Quaternion()

// Hangs from the head bone but stays upright with the body, so a dozing head does not tip the web over.
function useUpright() {
  const ref = useRef<Group>(null)
  useFrame(() => {
    const group = ref.current
    if (!group?.parent) return
    group.parent.getWorldQuaternion(headTurn)
    heading.setFromQuaternion(headTurn, 'YXZ')
    yaw.setFromAxisAngle(UP, heading.y)
    group.quaternion.copy(headTurn.invert().multiply(yaw))
  })
  return ref
}

// Strung in the corner between the head and the right shoulder: small after two weeks, larger with a
// spider dangling from it after a month, and a second one on the left shoulder past two months.
export function HeadCobweb({ look }: { look: CobwebLook }) {
  const reduced = useReducedMotion()
  const texture = useMemo(() => webTexture(), [])
  const upright = useUpright()
  if (!look.web) return null
  return (
    <group ref={upright}>
      <WebPlane texture={texture} size={look.web === 'large' ? LARGE : SMALL} side={1} />
      {look.twin && <WebPlane texture={texture} size={TWIN} side={-1} />}
      {look.spider && <Spider reduced={reduced} />}
    </group>
  )
}
