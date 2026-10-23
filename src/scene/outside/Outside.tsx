'use client'

import type { Rect } from '@/types/outside'
import { useSkyLook } from '../render/SkyContext'
import { StaticBatch } from '../render/StaticBatch'
import { Cars } from './Cars'
import { Facade } from './Facade'
import { Neighbors } from './Neighbors'
import { Praca } from './Praca'
import { Skyline } from './Skyline'
import { StreetLamps } from './StreetLamps'
import { StreetProps } from './StreetProps'
import { Streetscape } from './Streetscape'

export function Outside({ count, footprint, lite }: { count: number; footprint: Rect; lite: boolean }) {
  const { lampsOn, night, phase } = useSkyLook()
  const version = `${count}|${footprint.minX}|${footprint.maxX}|${lite}|${lampsOn}|${night}|${phase}`
  return (
    <StaticBatch version={version}>
      <Streetscape />
      <Facade count={count} minX={footprint.minX} maxX={footprint.maxX} backZ={footprint.minZ} />
      <StreetLamps />
      {!lite && <Neighbors footprint={footprint} />}
      {!lite && <StreetProps leftEdge={footprint.minX} />}
      {!lite && <Cars />}
      {!lite && <Praca />}
      {!lite && <Skyline />}
    </StaticBatch>
  )
}
