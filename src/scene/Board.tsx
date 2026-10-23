'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/client/store'
import { monthTitle, noticeCards } from '@/domain/board'
import type { Board as BoardData } from '@/types/domain'
import { EmployeeOfTheMonth } from './hallOfFame/EmployeeOfTheMonth'
import { NoticeBoard } from './hallOfFame/NoticeBoard'
import { BACK_WALL_Z } from './layout'
import { BOARD_SPAN } from './boardLayout'
import { isDragRelease } from './pointer'
import { StaticBatch } from './render/StaticBatch'

const WALL_FACE = BACK_WALL_Z + 0.11
const CENTER_Y = (BOARD_SPAN.bottom + BOARD_SPAN.top) / 2
const NOTICE_X = BOARD_SPAN.minX + 5
const FRAME_X = 4.6

const setCursor = (value: string) => () => {
  document.body.style.cursor = value
}

export function Board({ board, generatedAt }: { board: BoardData; generatedAt: string }) {
  const focusSpot = useAppStore(state => state.focusSpot)
  const cards = useMemo(() => noticeCards(board), [board])
  const month = useMemo(() => monthTitle(generatedAt), [generatedAt])
  return (
    <group
      position={[0, CENTER_Y, WALL_FACE]}
      onClick={event => {
        event.stopPropagation()
        if (isDragRelease(event)) return
        focusSpot('board')
      }}
      onPointerOver={setCursor('pointer')}
      onPointerOut={setCursor('')}
    >
      <StaticBatch version={generatedAt}>
        <NoticeBoard position={[NOTICE_X, 0, 0]} cards={cards} />
        <EmployeeOfTheMonth position={[FRAME_X, 0, 0]} login={board.employeeOfTheMonth} month={month} slacking={board.slacking} />
      </StaticBatch>
    </group>
  )
}
