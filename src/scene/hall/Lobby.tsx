'use client'

import { t } from '@/i18n'


import { Text } from '@react-three/drei'
import { useMemo } from 'react'
import { FONT_URL } from '../fonts'
import { RopeFence } from '../Stanchions'
import { InstancedProp } from './InstancedProp'
import { lobbyBins, lobbyPlants, priorityBenches, priorityLane, waitingBenches } from './lobbyLayout'
import { PrioritySign } from './PrioritySign'

const BENCH_COLORS = { carpet: '#2f6d8c', wood: '#5d6670' }
const PRIORITY_RIBBON = '#1f57a8'
const SIGN_TURN = 0.25

// The front half of the hall: waiting benches right of the door, the priority corner on the left.
export function Lobby({ count }: { count: number }) {
  const benches = useMemo(() => [...waitingBenches(count), ...priorityBenches(count)], [count])
  const plants = useMemo(() => lobbyPlants(count), [count])
  const lane = useMemo(() => priorityLane(count), [count])
  return (
    <group>
      <InstancedProp id="bench-waiting" placements={benches} colors={BENCH_COLORS} />
      <InstancedProp id="plant-potted" placements={plants} />
      <InstancedProp id="trash-bin" placements={lobbyBins()} />
      <RopeFence rails={lane.rails} color={PRIORITY_RIBBON} />
      <PrioritySign position={lane.sign} rotation={SIGN_TURN} />
      <Text font={FONT_URL} position={[lane.floor[0], 0.012, lane.floor[2]]} rotation-x={-Math.PI / 2} fontSize={0.34} letterSpacing={0.08} color={PRIORITY_RIBBON} fillOpacity={0.75} anchorX="center" anchorY="middle">
        {t('ui.priority')}
      </Text>
    </group>
  )
}
