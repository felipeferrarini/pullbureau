import { describe, expect, it } from 'vitest'
import { PLUMBOB_STYLE, plumbobLabel, ticketCode } from './plumbobRules'

describe('plumbob', () => {
  it('pads the ticket to four digits', () => {
    expect([313, 7, 12345].map(ticketCode)).toEqual(['0313', '0007', '2345'])
  })

  it('labels the ticket with its age in whole days', () => {
    expect(plumbobLabel({ number: 313, ageDays: 24.7 })).toBe('senha 0313 · 24d')
  })

  it('glows for every ci state except none and pulses only while running', () => {
    expect(PLUMBOB_STYLE.none.glow).toBeLessThan(1)
    expect([PLUMBOB_STYLE.success, PLUMBOB_STYLE.failure, PLUMBOB_STYLE.pending].every(style => style.glow > 1)).toBe(true)
    expect(Object.entries(PLUMBOB_STYLE).filter(([, style]) => style.pulse).map(([state]) => state)).toEqual(['pending'])
  })
})
