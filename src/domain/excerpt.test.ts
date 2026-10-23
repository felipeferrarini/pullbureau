import { describe, expect, it } from 'vitest'
import { toExcerpt } from './excerpt'

describe('toExcerpt', () => {
  it('replaces code blocks and strips markdown', () => {
    expect(toExcerpt('**Isso** não deveria estar aqui:\n```ts\nconst a = 1\n```\nver `service`')).toBe('Isso não deveria estar aqui: [código] ver service')
  })

  it('keeps link text and drops images and html', () => {
    expect(toExcerpt('olha ![img](http://x/y.png) [esse doc](http://x) <br/> aqui')).toBe('olha esse doc aqui')
  })

  it('cuts at 60 code points without splitting emoji', () => {
    const result = toExcerpt(`${'a'.repeat(59)}😀😀`)
    expect(Array.from(result)).toHaveLength(60)
    expect(result.endsWith('…')).toBe(true)
  })

  it('never returns an empty string', () => {
    expect(toExcerpt('')).toBe('...')
    expect(toExcerpt('```\nonly code\n```').length).toBeGreaterThan(0)
  })
})
