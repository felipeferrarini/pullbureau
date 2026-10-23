import { describe, expect, it } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('formats in Brasília time', () => {
    expect(formatDate('2025-12-02T17:29:00Z')).toBe('02/12/2025')
    expect(formatDate('2026-01-01T02:00:00Z')).toBe('31/12/2025')
  })
})
