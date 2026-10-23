// R3F still fires onClick when the pointer was dragged to orbit the camera; delta is the distance moved.
export const CLICK_TOLERANCE_PX = 6

export const isDragRelease = (event: { delta: number }) => event.delta > CLICK_TOLERANCE_PX
