'use client'

import { t } from '@/i18n'


import { Text } from '@react-three/drei'
import { FONT_URL } from './fonts'
import { useMemo } from 'react'
import { Corridor } from './hall/Corridor'
import { GraniliteFloor } from './hall/Floor'
import { InstancedProp } from './hall/InstancedProp'
import { Furnishing } from './hall/Furnishing'
import { Lobby } from './hall/Lobby'
import { BackDoor, CeilingFan, PendantLamp, Poster, Totem, WallClock, WaterCooler } from './hall/WallDecor'
import { Wall, backWindows, sideWindows } from './hall/Walls'
import { BACK_WALL_Z, FACADE_Z, backDoorSpot, copaSpot, hallWidth, totemSpot, waitingSeat } from './layout'
import { palette } from './palette'
import { useSkyLook } from './render/SkyContext'
import { StaticBatch } from './render/StaticBatch'

const DEPTH = FACADE_Z - BACK_WALL_Z
const CENTER_Z = (FACADE_Z + BACK_WALL_Z) / 2
const DOORWAY = { from: 3.2, to: 6.2, height: 2.6 }

function OutOfOrderSign({ x }: { x: number }) {
  return (
    <group position={[x, 5.1, BACK_WALL_Z + 0.16]}>
      <mesh>
        <boxGeometry args={[4.4, 0.9, 0.05]} />
        <meshStandardMaterial color={palette.danger} emissive={palette.danger} emissiveIntensity={0.6} />
      </mesh>
      <Text font={FONT_URL} position={[0, 0, 0.04]} fontSize={0.32} color={palette.signText} anchorX="center" anchorY="middle">
        {t('ui.systemOffline')}
      </Text>
    </group>
  )
}

function Fans({ left, right, waitingZ, copaZ }: { left: number; right: number; waitingZ: number; copaZ: number }) {
  return (
    <>
      <CeilingFan position={[left + 2.6, 4.7, copaZ - 1]} speed={2.6} />
      <CeilingFan position={[right - 2.6, 4.7, waitingZ + 1.2]} speed={3.1} />
      <CeilingFan position={[left + 3.5, 4.7, FACADE_Z - 2.5]} speed={2.2} />
    </>
  )
}

function FrontBenches({ width }: { width: number }) {
  const placements = useMemo(() => {
    const half = width / 2
    const xs: number[] = []
    for (let x = 3.2; x < half - 6.5; x += 2.4) xs.push(x, -x)
    return xs.map(x => ({ position: [x, 0, FACADE_Z - 0.75] as [number, number, number], rotation: Math.PI }))
  }, [width])
  return <InstancedProp id="bench-waiting" placements={placements} colors={{ carpet: '#2f6d8c', wood: '#5d6670' }} />
}

function Posters({ left, right, count }: { left: number; right: number; count: number }) {
  const waitingZ = waitingSeat(0, count)[2]
  return (
    <>
      <Poster position={[left + 5.6, 2.55, BACK_WALL_Z + 0.12]} width={1.5} height={1.05} title={t('ui.pleaseRespectBureauStaff')} body={t('ui.courtesyHelpsKeepTheQueueMoving')} accent="#b3261e" />
      <Poster position={[right - 5.4, 2.5, BACK_WALL_Z + 0.12]} width={1.2} height={0.9} title={t('ui.noInstantPayments')} body={t('ui.paymentByOfficialFormOnly')} accent="#1f4d3a" tilt={0.03} />
      <Poster position={[right - 0.12, 2.55, waitingZ + 1.4]} rotation={-Math.PI / 2} width={1.6} height={0.85} title={t('ui.pleaseWaitToBeCalled')} body={t('ui.priorityTicketsGoFirst')} accent="#1f4d3a" />
      <Poster position={[left + 0.12, 2.6, CENTER_Z + 3]} rotation={Math.PI / 2} width={1.1} height={0.8} title={t('ui.quietPlease')} body={t('ui.bureauBusinessHours')} accent="#2b4c7e" tilt={-0.02} />
    </>
  )
}

type HallProps = { counterCount: number; closedCount: number; stale: boolean }

export function Hall({ counterCount, closedCount, stale }: HallProps) {
  const width = hallWidth(counterCount)
  const left = -width / 2
  const right = width / 2
  const [doorX, , doorZ] = backDoorSpot(counterCount)
  const waitingZ = waitingSeat(0, counterCount)[2]
  const { phase, night } = useSkyLook()
  return (
    <StaticBatch version={`${counterCount}|${closedCount}|${stale}|${phase}|${night}`}>
      <GraniliteFloor width={width} depth={DEPTH} centerZ={CENTER_Z} />
      <Wall length={width + 0.4} position={[0, 0, BACK_WALL_Z]} rotation={0} windows={backWindows(width)} />
      <Wall length={DEPTH} position={[left - 0.1, 0, CENTER_Z]} rotation={Math.PI / 2} windows={sideWindows()} />
      <Wall length={DEPTH} position={[right + 0.1, 0, CENTER_Z]} rotation={-Math.PI / 2} windows={closedCount ? [] : sideWindows()} gap={closedCount ? DOORWAY : null} />
      {closedCount > 0 && <Corridor count={counterCount} closedCount={closedCount} />}
      <Furnishing count={counterCount} />
      <Fans left={left} right={right} waitingZ={waitingZ} copaZ={copaSpot(0, counterCount)[2]} />
      <FrontBenches width={width} />
      <Lobby count={counterCount} />
      <PendantLamp position={[right - 3, 4.6, waitingZ + 1.3]} />
      <PendantLamp position={[left + 2.5, 4.6, -7.5]} />
      <WallClock position={[doorX, 3.6, BACK_WALL_Z + 0.16]} />
      <Posters left={left} right={right} count={counterCount} />
      <WaterCooler position={[right - 0.45, 0, waitingZ - 2.3]} rotation={-Math.PI / 2} />
      <Totem position={totemSpot()} />
      <BackDoor x={doorX} z={doorZ - 0.45} />
      <group position={[left + 2.1, 3.3, BACK_WALL_Z + 0.14]}>
        <Text font={FONT_URL} fontSize={0.42} color={palette.copa} anchorX="center">
          {t('ui.breakRoom')}
        </Text>
      </group>
      {stale && <OutOfOrderSign x={-width / 4} />}
    </StaticBatch>
  )
}
