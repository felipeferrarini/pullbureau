import { BACK_WALL_Z, CAMERA_FOV, type CameraGoal } from './layout'

export const BOARD_SPAN = { minX: -7.9, maxX: 6.5, bottom: 3.5, top: 6.85 }

const BOARD_PAD = 1.2
const BOARD_RISE = 0.47
const BOARD_DROP = 0.6

export function boardCamera(aspect: number): CameraGoal {
  const x = (BOARD_SPAN.minX + BOARD_SPAN.maxX) / 2
  const y = (BOARD_SPAN.bottom + BOARD_SPAN.top) / 2
  const halfWidth = (BOARD_SPAN.maxX - BOARD_SPAN.minX) / 2 + BOARD_PAD
  const tanH = Math.tan((CAMERA_FOV * Math.PI) / 360) * Math.max(0.5, aspect)
  const distance = Math.max(9, halfWidth / tanH)
  return { position: [x, y + distance * BOARD_RISE, BACK_WALL_Z + distance], target: [x, y - BOARD_DROP, BACK_WALL_Z] }
}
