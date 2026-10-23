import { describe, expect, it } from 'vitest'
import { parsePrParams } from './prParams'

describe('parsePrParams', () => {
  it('accepts real repo names and positive integers', () => {
    expect(parsePrParams('api', '412')).toEqual({ repo: 'api', number: 412 })
    expect(parsePrParams('my.repo_v2', '1')).toEqual({ repo: 'my.repo_v2', number: 1 })
  })

  it('rejects anything else', () => {
    for (const [repo, number] of [['../etc', '1'], ['a/b', '1'], ['hub', '1e3'], ['hub', '0'], ['hub', '-1'], ['hub', ''], ['', '1'], ['hub', '99999999']]) {
      expect(parsePrParams(repo, number)).toBeNull()
    }
  })
})
