export const palette = {
  sky: '#b9d7ea',
  floorA: '#ddd6c6',
  floorB: '#c4bca9',
  wall: '#e9e2d0',
  wallTrim: '#7a8b6f',
  desk: '#8b6b4a',
  deskTop: '#d3cab4',
  glass: '#cfe8ef',
  sign: '#1d3557',
  signText: '#f1faee',
  sidewalk: '#a3a3a3',
  street: '#3d3d3d',
  ribbon: '#c1121f',
  post: '#444444',
  chair: '#f4a261',
  copa: '#6d597a',
  plantPot: '#9c6644',
  plantDry: '#a68a64',
  danger: '#e63946',
  ok: '#2a9d8f',
  pending: '#e9c46a',
  paper: '#fdfcf7',
  text: '#222222',
} as const

export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}
