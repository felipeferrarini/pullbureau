import { describe, expect, it } from 'vitest'
import { debugEggs } from './debugEggs'

describe('debug eggs', () => {
  it('reads one or many eggs and ignores the rest', () => {
    expect([...debugEggs('baile')]).toEqual(['baile'])
    expect([...debugEggs('Sexta,caramelo|cafe nada')]).toEqual(['caramelo', 'sexta', 'cafe'])
    expect(debugEggs(null).size).toBe(0)
    expect(debugEggs('').size).toBe(0)
  })
})
