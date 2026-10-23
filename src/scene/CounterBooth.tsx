'use client'

import { t } from '@/i18n'


import { Line, Sparkles, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, type Group, type MeshStandardMaterial } from 'three'
import { useAppStore } from '@/client/store'
import { playSound } from '@/sound/sfx'
import type { Counter } from '@/types/domain'
import type { Vec3 } from '@/types/scene'
import { AwayPlate } from './eggs/CoffeeBreak'
import { FONT_URL } from './fonts'
import { hallColors } from './hall/colors'
import { CLOSED_SPACING, COUNTER_SPACING, COUNTER_Z, counterX, isClosedIndex } from './layout'
import { palette } from './palette'
import { ticketCode } from './plumbobRules'
import { DYNAMIC } from './render/batchMeshes'
import { isDragRelease } from './pointer'

export type LampColor = 'red' | 'green' | null

type Props = { counter: Counter; index: number; count: number; last: boolean; lamp?: LampColor; away?: boolean; signDrop?: number; repoSignOnly?: boolean; onFocus?: (repo: string) => void }

const DESK_WIDTH = 2.7
const DESK_HEIGHT = 1.05
const DESK_DEPTH = 0.75
const GLASS_TOP = 2.25
const SIGN_Y = 4.4
const REPO_SIGN_Y = 3.86
const BLINK_MS = 2600
const LED_ON = new Color('#ff1e0a').multiplyScalar(4.5)
const LED_DIM = new Color('#4a0c08')

function Lamp({ color, position }: { color: LampColor; position: Vec3 }) {
  const material = useRef<MeshStandardMaterial>(null)
  const tone = color === 'red' ? palette.danger : color === 'green' ? palette.ok : '#555555'
  useFrame(({ clock }) => {
    if (!material.current) return
    material.current.emissiveIntensity = color === 'red' ? (Math.sin(clock.elapsedTime * 12) > 0 ? 3.5 : 0.2) : color ? 3 : 0
  })
  return (
    <mesh position={position} userData={DYNAMIC}>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial ref={material} color={tone} emissive={tone} />
    </mesh>
  )
}

function Desk() {
  return (
    <group>
      <mesh position={[0, DESK_HEIGHT / 2 + 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[DESK_WIDTH, DESK_HEIGHT - 0.08, DESK_DEPTH]} />
        <meshStandardMaterial color={hallColors.formica} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.06, 0.03]} receiveShadow>
        <boxGeometry args={[DESK_WIDTH - 0.1, 0.12, DESK_DEPTH - 0.02]} />
        <meshStandardMaterial color={hallColors.formicaDark} roughness={0.7} />
      </mesh>
      {[-1, 0, 1].map(k => (
        <mesh key={k} position={[k * 0.98, DESK_HEIGHT / 2 + 0.04, DESK_DEPTH / 2 + 0.006]}>
          <boxGeometry args={[0.03, DESK_HEIGHT - 0.2, 0.012]} />
          <meshStandardMaterial color={hallColors.formicaDark} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, DESK_HEIGHT + 0.025, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[DESK_WIDTH + 0.12, 0.05, DESK_DEPTH + 0.18]} />
        <meshStandardMaterial color={hallColors.laminate} roughness={0.35} />
      </mesh>
      <mesh position={[0, DESK_HEIGHT + 0.025, DESK_DEPTH / 2 + 0.145]}>
        <boxGeometry args={[DESK_WIDTH + 0.13, 0.055, 0.02]} />
        <meshStandardMaterial color={hallColors.edge} roughness={0.5} />
      </mesh>
    </group>
  )
}

function Glass({ shutter }: { shutter: boolean }) {
  const height = GLASS_TOP - DESK_HEIGHT - 0.05
  const y = DESK_HEIGHT + 0.05 + height / 2
  return (
    <group position={[0, 0, -0.05]}>
      <mesh position={[0, y + 0.1, 0]} renderOrder={1}>
        <boxGeometry args={[DESK_WIDTH - 0.1, height - 0.2, 0.015]} />
        <meshStandardMaterial color="#e6f6fb" transparent opacity={0.16} roughness={0.05} metalness={0.1} depthWrite={false} />
      </mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (DESK_WIDTH / 2 - 0.03), y, 0]} castShadow>
          <boxGeometry args={[0.05, height, 0.05]} />
          <meshStandardMaterial color={hallColors.chrome} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, GLASS_TOP, 0]} castShadow>
        <boxGeometry args={[DESK_WIDTH, 0.06, 0.06]} />
        <meshStandardMaterial color={hallColors.chrome} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.62, 0.012]}>
        <ringGeometry args={[0.06, 0.09, 24]} />
        <meshStandardMaterial color={hallColors.chrome} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, DESK_HEIGHT + 0.17, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.06]} />
        <meshStandardMaterial color={hallColors.chrome} metalness={0.6} roughness={0.3} />
      </mesh>
      {shutter && <Shutter />}
    </group>
  )
}

function Shutter() {
  const slats = 9
  const top = GLASS_TOP + 0.12
  const bottom = 1.55
  const step = (top - bottom) / slats
  return (
    <group position={[0, 0, 0.06]}>
      <mesh position={[0, top + 0.12, 0]} castShadow>
        <boxGeometry args={[DESK_WIDTH + 0.1, 0.26, 0.24]} />
        <meshStandardMaterial color={hallColors.grille} roughness={0.6} metalness={0.5} />
      </mesh>
      {Array.from({ length: slats }, (_, i) => (
        <mesh key={i} position={[0, top - step * (i + 0.5), 0]} rotation-x={0.12} castShadow>
          <boxGeometry args={[DESK_WIDTH - 0.04, step * 0.92, 0.03]} />
          <meshStandardMaterial color={i % 3 === 2 ? hallColors.rust : hallColors.grille} roughness={0.55} metalness={0.55} />
        </mesh>
      ))}
      <group position={[0.35, bottom + 0.42, 0.04]} rotation-z={-0.07}>
        <mesh>
          <planeGeometry args={[1.3, 0.42]} />
          <meshStandardMaterial color={hallColors.poster} roughness={0.9} side={DoubleSide} />
        </mesh>
        <Text font={FONT_URL} position={[0, 0, 0.01]} fontSize={0.13} color="#b3261e" anchorX="center" anchorY="middle">
          {t('ui.comeBackAnotherDay')}
        </Text>
      </group>
    </group>
  )
}

function Divider({ x }: { x: number }) {
  return (
    <group position={[x, 0, -0.55]}>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.06, 2.3, 1.9]} />
        <meshStandardMaterial color={hallColors.divider} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.32, 0]}>
        <boxGeometry args={[0.09, 0.05, 1.92]} />
        <meshStandardMaterial color={hallColors.dividerFrame} roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  )
}

function TicketDisplay({ ticket, closed, away }: { ticket: number; closed: boolean; away: boolean }) {
  const text = useRef<Group>(null)
  const blinkUntil = useRef(0)
  const previous = useRef(ticket)
  const material = useMemo(() => ({ color: closed ? LED_DIM : LED_ON }), [closed])

  useEffect(() => {
    if (previous.current === ticket) return
    previous.current = ticket
    blinkUntil.current = performance.now() + BLINK_MS
    if (useAppStore.getState().soundOn) playSound('ticket')
  }, [ticket])

  useFrame(() => {
    if (!text.current) return
    const blinking = performance.now() < blinkUntil.current
    text.current.visible = !blinking || Math.floor(performance.now() / 180) % 2 === 0
  })

  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.92, 0.5, 0.14]} />
        <meshStandardMaterial color={hallColors.ledHousing} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.071]}>
        <planeGeometry args={[0.8, 0.38]} />
        <meshStandardMaterial color={hallColors.ledOff} roughness={0.3} />
      </mesh>
      <group ref={text}>
        <Text font={FONT_URL} position={[0, 0, 0.08]} fontSize={0.27} letterSpacing={0.06} color={material.color} anchorX="center" anchorY="middle">
          {closed ? '----' : away ? t('ui.coffee') : ticketCode(ticket)}
        </Text>
      </group>
    </group>
  )
}

function HangingSigns({ counter, number, closed, away, repoOnly }: { counter: Counter; number: number; closed: boolean; away: boolean; repoOnly: boolean }) {
  return (
    <group>
      {!repoOnly && <CounterNumberSigns counter={counter} number={number} closed={closed} away={away} />}
      <RepoSign repo={counter.repo} closed={closed} hanging={repoOnly} />
    </group>
  )
}

function CounterNumberSigns({ counter, number, closed, away }: { counter: Counter; number: number; closed: boolean; away: boolean }) {
  const label = t('ui.counterNumber', { number: String(number).padStart(2, '0') })
  return (
    <group>
      {[-1.1, 1.1].map(x => (
        <mesh key={x} position={[x, (SIGN_Y + 7) / 2, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 7 - SIGN_Y, 6]} />
          <meshStandardMaterial color="#555b60" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <group position={[0.45, SIGN_Y, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.52, 0.1]} />
          <meshStandardMaterial color={closed ? '#5b6660' : hallColors.signGreen} roughness={0.5} />
        </mesh>
        <Text font={FONT_URL} position={[0, 0, 0.06]} fontSize={0.26} letterSpacing={0.04} color={hallColors.signText} anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
      <group position={[-0.95, SIGN_Y, 0]}>
        <TicketDisplay ticket={counter.currentTicket} closed={closed} away={away} />
      </group>
    </group>
  )
}

function RepoSign({ repo, closed, hanging }: { repo: string; closed: boolean; hanging: boolean }) {
  return (
    <group position={[0, REPO_SIGN_Y, 0]}>
      {hanging &&
        [-1.1, 1.1].map(x => (
          <mesh key={x} position={[x, 1.6, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 3, 6]} />
            <meshStandardMaterial color="#555b60" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      <mesh renderOrder={1}>
        <boxGeometry args={[2.6, 0.44, 0.03]} />
        <meshStandardMaterial color={hallColors.acrylic} transparent opacity={0.85} roughness={0.15} emissive="#ffffff" emissiveIntensity={closed ? 0 : 0.35} />
      </mesh>
      <mesh position={[0, -0.19, 0.017]}>
        <planeGeometry args={[2.6, 0.05]} />
        <meshStandardMaterial color={closed ? '#7d827f' : hallColors.band} />
      </mesh>
      <Text font={FONT_URL} position={[0, 0.03, 0.03]} fontSize={0.25} maxWidth={2.45} color={closed ? '#6c706d' : '#163a2c'} anchorX="center" anchorY="middle">
        {repo}
      </Text>
    </group>
  )
}

const WEB_SPOKES = Array.from({ length: 5 }, (_, i) => (i * Math.PI) / 8)

function CornerWeb({ position, flip }: { position: Vec3; flip: boolean }) {
  const sign = flip ? -1 : 1
  const points = (r: number) => WEB_SPOKES.map(a => [sign * Math.cos(a) * r, -Math.sin(a) * r, 0] as Vec3)
  return (
    <group position={position}>
      {WEB_SPOKES.map(a => (
        <Line key={a} points={[[0, 0, 0], [sign * Math.cos(a) * 0.5, -Math.sin(a) * 0.5, 0]]} color={hallColors.web} lineWidth={1} transparent opacity={0.65} />
      ))}
      {[0.18, 0.32, 0.46].map(r => (
        <Line key={r} points={points(r)} color={hallColors.web} lineWidth={1} transparent opacity={0.55} />
      ))}
    </group>
  )
}

function Abandonment() {
  return (
    <group>
      <CornerWeb position={[-DESK_WIDTH / 2 + 0.02, GLASS_TOP - 0.02, 0.02]} flip={false} />
      <CornerWeb position={[DESK_WIDTH / 2 - 0.02, GLASS_TOP - 0.02, 0.02]} flip />
      <Sparkles count={40} scale={[3, 2.4, 2.5]} position={[0, 1.6, 0.8]} size={2.2} speed={0.15} opacity={0.55} color={hallColors.dust} noise={0.6} />
    </group>
  )
}

export function CounterBooth({ counter, index, count, last, lamp = null, away = false, signDrop = 0, repoSignOnly = false, onFocus }: Props) {
  const closed = isClosedIndex(index, count)
  const half = (closed ? CLOSED_SPACING : COUNTER_SPACING) / 2
  const number = index + 1
  return (
    <group
      position={[counterX(index, count), 0, COUNTER_Z]}
      onClick={event => {
        event.stopPropagation()
        if (isDragRelease(event)) return
        onFocus?.(counter.repo)
      }}
    >
      <Desk />
      <Glass shutter={closed} />
      <Divider x={-half} />
      {last && <Divider x={half} />}
      <group position-y={-signDrop}>
        <HangingSigns counter={counter} number={number} closed={closed} away={away} repoOnly={repoSignOnly} />
      </group>
      {!closed && <Lamp color={lamp} position={[1.3, DESK_HEIGHT + 0.14, 0.25]} />}
      {closed && <Abandonment />}
      {away && !closed && <AwayPlate />}
    </group>
  )
}
