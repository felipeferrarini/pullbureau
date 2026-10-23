import { describe, expect, it } from 'vitest'
import { createBotFilter, loginOf } from './actors'

const isBot = createBotFilter(['coderabbitai', 'SonarCloud'])

describe('createBotFilter', () => {
  it('flags graphql bot actors even without the [bot] suffix', () => {
    expect(isBot({ __typename: 'Bot', login: 'coderabbitai' })).toBe(true)
    expect(isBot({ __typename: 'Bot', login: 'some-new-bot' })).toBe(true)
  })

  it('flags [bot] suffixes and ignored logins case-insensitively', () => {
    expect(isBot({ __typename: 'User', login: 'renovate[bot]' })).toBe(true)
    expect(isBot({ __typename: 'User', login: 'sonarcloud' })).toBe(true)
  })

  it('keeps humans and ghost authors', () => {
    expect(isBot({ __typename: 'User', login: 'example-user' })).toBe(false)
    expect(isBot(null)).toBe(false)
  })
})

describe('loginOf', () => {
  it('maps deleted users to ghost', () => {
    expect(loginOf(null)).toBe('ghost')
    expect(loginOf({ __typename: 'User', login: 'x' })).toBe('x')
  })
})
