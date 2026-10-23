import { expect, it } from 'vitest'
import { avatarImageUrl, fictionalAvatar } from './avatar'

it('uses only generated initials in demo, without requesting a real GitHub profile', () => {
  expect(avatarImageUrl('alice', 64, true)).toBe(fictionalAvatar('alice'))
  expect(decodeURIComponent(fictionalAvatar('alice'))).toContain('>A</text>')
  expect(avatarImageUrl('alice', 64, false)).toBe('https://avatars.githubusercontent.com/alice?size=64')
})
