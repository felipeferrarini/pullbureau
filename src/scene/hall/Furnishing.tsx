'use client'

import { useMemo } from 'react'
import type { PropPlacement } from '@/types/scene'
import { ATTENDANT_Z, BACK_WALL_Z, COUNTER_Z, FACADE_Z, copaSpot, counterX, hallWidth, waitingSeat } from '../layout'
import { InstancedProp, SingleProp } from './InstancedProp'

const WALL_FACE = BACK_WALL_Z + 0.1
const CHAIR_COLORS = { carpet: '#e07a2f', wood: '#5d6670' }
const WAITING_SEATS = 12
// Seated hips sit about this far behind the feet (see seat.ts), so the cushion goes under them, not under the knees.
const CHAIR_UNDER_HIPS = 0.24

function boothDesktops(count: number): Record<string, PropPlacement[]> {
  const screens: PropPlacement[] = []
  const keyboards: PropPlacement[] = []
  const chairs: PropPlacement[] = []
  const books: PropPlacement[] = []
  for (let i = 0; i < count; i++) {
    const x = counterX(i, count)
    screens.push({ position: [x - 1.08, 1.1, COUNTER_Z - 0.12], rotation: Math.PI + 0.5, scale: 0.62 })
    keyboards.push({ position: [x - 0.85, 1.1, COUNTER_Z - 0.3], rotation: Math.PI + 0.3, scale: 0.7 })
    books.push({ position: [x + 1.05, 1.1, COUNTER_Z - 0.12], rotation: 0.3 + i, scale: 0.8 })
    chairs.push({ position: [x + (i % 2 ? 0.6 : -0.6), 0, ATTENDANT_Z - 0.75], rotation: Math.PI + (i % 3) * 0.2 })
  }
  return { screens, keyboards, chairs, books }
}

function staffOffice(count: number): Record<string, PropPlacement[]> {
  const cabinets: PropPlacement[] = []
  const bookcases: PropPlacement[] = []
  const boxes: PropPlacement[] = []
  const plants: PropPlacement[] = []
  for (let i = 0; i < count; i++) {
    const x = counterX(i, count)
    if (i % 2 === 0) {
      bookcases.push({ position: [x - 0.6, 0, WALL_FACE + 0.26] })
      boxes.push({ position: [x + 0.7, 0, WALL_FACE + 0.3], rotation: 0.2 }, { position: [x + 0.72, 0.56, WALL_FACE + 0.3], rotation: -0.15, scale: 0.9 })
    } else {
      cabinets.push({ position: [x - 0.5, 0, WALL_FACE + 0.24] })
      plants.push({ position: [x - 0.75, 0.77, WALL_FACE + 0.24] })
      boxes.push({ position: [x + 0.8, 0, WALL_FACE + 0.3], rotation: -0.3 })
    }
  }
  return { cabinets, bookcases, boxes, plants }
}

function waitingRoom(count: number) {
  const seats = Array.from({ length: WAITING_SEATS }, (_, i) => {
    const [x, , z] = waitingSeat(i, count)
    return { position: [x, 0, z - CHAIR_UNDER_HIPS], rotation: 0 } as PropPlacement
  })
  const [x0, , z0] = waitingSeat(0, count)
  return { seats, rug: { position: [x0 - 1.5, 0.005, z0 + 1.2], scale: 1.45 } as PropPlacement }
}

export function Furnishing({ count }: { count: number }) {
  const width = hallWidth(count)
  const left = -width / 2
  const right = width / 2
  const desks = useMemo(() => boothDesktops(count), [count])
  const office = useMemo(() => staffOffice(count), [count])
  const waiting = useMemo(() => waitingRoom(count), [count])
  const [copaX, , copaZ] = copaSpot(1, count)
  const plants = useMemo<PropPlacement[]>(
    () => [
      { position: [left + 0.7, 0, FACADE_Z - 0.8], scale: 1.4 },
      { position: [right - 0.7, 0, FACADE_Z - 0.8], scale: 1.4 },
      { position: [right - 0.6, 0, waitingSeat(0, count)[2] - 1.2], scale: 1.3 },
      { position: [counterX(0, count) - 2.6, 0, COUNTER_Z + 0.6], scale: 1.2 },
      { position: [counterX(count - 1, count) + 2.6, 0, COUNTER_Z + 0.6], scale: 1.2 },
    ],
    [left, right, count],
  )
  const bins = useMemo<PropPlacement[]>(
    () => [
      { position: [left + 5.1, 0, FACADE_Z - 1.4] },
      { position: [right - 5.2, 0, waitingSeat(0, count)[2] - 1.3] },
      { position: [left + 4.4, 0, BACK_WALL_Z + 0.5] },
    ],
    [left, right, count],
  )

  return (
    <group>
      <InstancedProp id="computer-screen" placements={desks.screens} />
      <InstancedProp id="computer-keyboard" placements={desks.keyboards} shadows={false} />
      <InstancedProp id="books" placements={desks.books} shadows={false} />
      <InstancedProp id="chair-office" placements={desks.chairs} />
      <InstancedProp id="drawers-side" placements={office.cabinets} />
      <InstancedProp id="bookcase-closed" placements={office.bookcases} />
      <InstancedProp id="box-closed" placements={office.boxes} />
      <InstancedProp id="plant-small-a" placements={office.plants} shadows={false} />
      <InstancedProp id="chair-waiting" placements={waiting.seats} colors={CHAIR_COLORS} />
      <SingleProp id="rug" {...waiting.rug} shadows={false} colors={{ carpet: '#7a3b2e' }} />
      <InstancedProp id="plant-potted" placements={plants} />
      <InstancedProp id="trash-bin" placements={bins} />
      <SingleProp id="coat-rack" position={[right - 0.6, 0, waitingSeat(0, count)[2] + 3.6]} />
      <SingleProp id="lamp-floor" position={[right - 0.6, 0, waitingSeat(0, count)[2] + 1.6]} />
      <Copa left={left} x={copaX} z={copaZ} />
    </group>
  )
}

function Copa({ left, x, z }: { left: number; x: number; z: number }) {
  const line = WALL_FACE + 0.46
  return (
    <group>
      <SingleProp id="kitchen-cabinet" position={[left + 0.75, 0, line]} />
      <SingleProp id="kitchen-sink" position={[left + 1.62, 0, line]} />
      <SingleProp id="kitchen-cabinet" position={[left + 2.49, 0, line]} />
      <SingleProp id="fridge-small" position={[left + 3.4, 0, line + 0.15]} />
      <SingleProp id="kitchen-cabinet-upper" position={[left + 0.75, 1.55, WALL_FACE + 0.23]} />
      <SingleProp id="kitchen-cabinet-upper" position={[left + 2.49, 1.55, WALL_FACE + 0.23]} />
      <SingleProp id="coffee-machine" position={[left + 0.7, 0.9, line - 0.05]} />
      <SingleProp id="microwave" position={[left + 2.5, 0.9, line - 0.05]} />
      <SingleProp id="radio" position={[left + 3.4, 1.2, line + 0.1]} scale={0.6} />
      <SingleProp id="table" position={[x, 0, z - 2.1]} />
      <InstancedProp
        id="chair-plain"
        placements={[
          { position: [x - 0.5, 0, z - 2.75], rotation: 0 },
          { position: [x + 0.5, 0, z - 2.75], rotation: 0 },
          { position: [x - 0.5, 0, z - 1.45], rotation: Math.PI },
        ]}
      />
    </group>
  )
}
