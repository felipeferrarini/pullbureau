import { hashString } from './hash'

export function fictionalAvatar(login: string): string {
  const initial = login.replace(/[^a-z0-9]/gi, '').charAt(0).toUpperCase() || '?'
  const hue = hashString(login) % 360
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="18" fill="hsl(${hue},45%,35%)"/><text x="48" y="65" text-anchor="middle" fill="white" font-family="sans-serif" font-size="50">${initial}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const avatarImageUrl = (login: string, size = 64, fictional = process.env.DEMO_MODE === '1') =>
  fictional ? fictionalAvatar(login) : `https://avatars.githubusercontent.com/${encodeURIComponent(login)}?size=${size}`
