import { clockOverride } from '@/eggs/clock'

// The scene clock honours the hidden `?hora=HH:mm` override (deployment time zone) for testing day and night.
export function sceneNow(): Date {
  const now = new Date()
  if (typeof window === 'undefined') return now
  return clockOverride(new URLSearchParams(window.location.search).get('hora'), now) ?? now
}
