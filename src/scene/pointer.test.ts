import { describe, expect, it } from 'vitest'
import { isDragRelease } from './pointer'

describe('isDragRelease', () => {
  it('tells a camera drag apart from a click', () => {
    expect(isDragRelease({ delta: 0 })).toBe(false)
    expect(isDragRelease({ delta: 4 })).toBe(false)
    expect(isDragRelease({ delta: 40 })).toBe(true)
  })
})
