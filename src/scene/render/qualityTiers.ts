import { t } from '@/i18n'
import type { Quality, QualityProfile, ViewportSize } from '@/types/scene'

export const QUALITIES: Quality[] = ['low', 'normal', 'high']
export const DEFAULT_QUALITY: Quality = 'normal'
export const QUALITY_LABELS: Record<Quality, string> = { low: t('ui.lowQuality'), normal: t('ui.normalQuality'), high: t('ui.highQuality') }
export const MIN_DPR = 0.6

export const QUALITY_PROFILES: Record<Quality, QualityProfile> = {
  low: { maxDpr: 1, maxPixels: 2.5e6, fps: 30, shadowMapSize: 0, shadowHz: 0, ao: false, bloom: false, multisampling: 0, adaptive: true },
  normal: { maxDpr: 1.5, maxPixels: 3.5e6, fps: 30, shadowMapSize: 2048, shadowHz: 10, ao: false, bloom: true, multisampling: 4, adaptive: true },
  // High is an explicit choice for the full look: it never trades resolution for frame rate.
  high: { maxDpr: 2, maxPixels: 6e6, fps: 60, shadowMapSize: 4096, shadowHz: Infinity, ao: true, bloom: true, multisampling: 4, adaptive: false },
}

export function parseQuality(value: string | null | undefined): Quality | null {
  return QUALITIES.find(quality => quality === value) ?? null
}

// The URL wins (?fx=), then what the person picked last time, then the default.
export function chooseQuality(forced: string | null, stored: string | null): Quality {
  return parseQuality(forced) ?? parseQuality(stored) ?? DEFAULT_QUALITY
}

// Device pixels per CSS pixel: never above the tier cap, and lower on big windows so the drawing buffer fits the pixel budget.
export function pixelRatio({ width, height, devicePixelRatio }: ViewportSize, profile: QualityProfile, scale = 1): number {
  const area = Math.max(1, width * height)
  const fit = Math.sqrt(profile.maxPixels / area)
  const ratio = Math.min(devicePixelRatio, profile.maxDpr, fit) * scale
  return Math.round(Math.max(MIN_DPR, ratio) * 100) / 100
}
