'use client'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color } from 'three'
import type { Group } from 'three'
import { hashString } from '@/shared/hash'
import type { QueuedPr } from '@/types/domain'
import { PLUMBOB_STYLE, plumbobLabel } from './plumbobRules'
import styles from './Plumbob.module.css'
import { PLUMBOB_SHAPE, STRETCH } from './Plumbobs'
import { type PlumbobEntry, registerPlumbob } from './plumbobRegistry'

export const PLUMBOB_Y = 2.42
export const PLUMBOB_SEATED_Y = 1.9
const SPIN = 0.9
const BOB = 0.025
const DUSTY_GLOW = 0.35

type Props = { pr: QueuedPr; height: number; showLabel: boolean; dusty: boolean }

export function Plumbob({ pr, height, showLabel, dusty }: Props) {
  const style = PLUMBOB_STYLE[pr.ci]
  const spinner = useRef<Group>(null)
  const phase = useMemo(() => (hashString(`${pr.repo}#${pr.number}`) % 628) / 100, [pr.repo, pr.number])
  const glow = dusty ? Math.min(style.glow, DUSTY_GLOW) : style.glow
  const entry = useRef<PlumbobEntry | null>(null)

  useEffect(() => {
    if (!spinner.current) return
    const created = { anchor: spinner.current, color: new Color(style.color), emissive: glow }
    entry.current = created
    return registerPlumbob(`${pr.repo}#${pr.number}`, created)
  }, [pr.repo, pr.number, style.color, glow])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    if (spinner.current) {
      spinner.current.rotation.y = t * SPIN
      spinner.current.position.y = height + Math.sin(t * 1.6) * BOB
    }
    if (entry.current && style.pulse) entry.current.emissive = glow * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 5)))
  })

  return (
    <group>
      <group ref={spinner} position={[0, height, 0]}>
        <mesh scale={[1, STRETCH, 1]} geometry={PLUMBOB_SHAPE} visible={false} dispose={null} />
      </group>
      {showLabel && (
        <Html center position={[0, height - 0.26, 0]} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
          <div className={styles.label}>{plumbobLabel(pr)}</div>
        </Html>
      )}
    </group>
  )
}
