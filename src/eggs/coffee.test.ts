import { describe, expect, it } from 'vitest'
import { buildVisitor } from '@/scene/actors'
import { copaSpot } from '@/scene/layout'
import type { Actor } from '@/types/scene'
import { chatFacing, coffeeSpots } from './coffee'

const attendant = (login: string, repo: string | null): Actor => ({ ...buildVisitor(`person:${login}`, login, 'm', [0, 0, 0], 0), kind: 'attendant', repo })

describe('coffee break', () => {
  it('sends seated attendants to the copa after the idle ones', () => {
    const actors = [attendant('a', 'x'), attendant('b', null), attendant('c', 'y'), { ...attendant('d', null), kind: 'customer' as const }]
    expect(coffeeSpots(actors, 3)).toEqual(
      new Map([
        ['person:a', { position: copaSpot(1, 3), facing: -Math.PI / 2 }],
        ['person:c', { position: copaSpot(2, 3), facing: -Math.PI / 2 }],
      ]),
    )
    expect(chatFacing(3)).toBe(Math.PI / 2)
  })
})
