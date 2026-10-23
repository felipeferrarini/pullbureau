import { describe, expect, it } from 'vitest'
import { loadConfig, validateLiveEnvironment } from './config'

describe('loadConfig', () => {
  it('requires explicit organization and leaves the optional inspector empty', () => {
    expect(loadConfig({ GITHUB_TOKEN: 't', GITHUB_ORG: 'acme' })).toEqual({
      token: 't',
      org: 'acme',
      ctoLogin: '',
      ignoredLogins: ['coderabbitai', 'sonarcloud', 'sonarqubecloud'],
      excludedLogins: [],
      characterOverrides: {},
    })
  })

  it('parses lists and overrides', () => {
    const config = loadConfig({
      GITHUB_TOKEN: 't',
      GITHUB_ORG: 'acme',
      IGNORED_LOGINS: ' a, b ,,',
      EXCLUDED_LOGINS: 'grace',
      CHARACTER_OVERRIDES: '{"alice":"businessman"}',
    })
    expect(config.ignoredLogins).toEqual(['a', 'b'])
    expect(config.excludedLogins).toEqual(['grace'])
    expect(config.characterOverrides).toEqual({ alice: 'businessman' })
  })

  it('fails without a token', () => {
    expect(() => loadConfig({})).toThrow('GITHUB_TOKEN')
  })

  it.each(['null', '[]', '5', '{"alice":4}'])('rejects invalid override shape %s', value => {
    expect(() => loadConfig({ GITHUB_TOKEN: 't', GITHUB_ORG: 'acme', CHARACTER_OVERRIDES: value })).toThrow('CHARACTER_OVERRIDES')
  })
  it('fails with a clear message on invalid overrides', () => {
    expect(() => loadConfig({ GITHUB_TOKEN: 't', GITHUB_ORG: 'acme', CHARACTER_OVERRIDES: '{nope' })).toThrow('CHARACTER_OVERRIDES')
  })
})

describe('live environment', () => {
  const live = { GITHUB_TOKEN: 'fixture-token', GITHUB_ORG: 'acme', AUTH_SECRET: 'fixture-secret', AUTH_GITHUB_ID: 'fixture-id', AUTH_GITHUB_SECRET: 'fixture-secret' }
  it('requires an organization without revealing credentials', () => {
    expect(() => loadConfig({ GITHUB_TOKEN: 'fixture-token' })).toThrow('GITHUB_ORG')
    expect(() => loadConfig({ GITHUB_TOKEN: ' ', GITHUB_ORG: 'acme' })).toThrow('GITHUB_TOKEN')
  })
  it('preserves an explicitly disabled inspector', () => {
    expect(loadConfig({ ...live, CTO_LOGIN: '' }).ctoLogin).toBe('')
  })
  it('validates every authentication requirement for live startup', () => {
    expect(() => validateLiveEnvironment(live)).not.toThrow()
    for (const key of ['AUTH_SECRET', 'AUTH_GITHUB_ID', 'AUTH_GITHUB_SECRET']) {
      expect(() => validateLiveEnvironment({ ...live, [key]: '' })).toThrow(key)
    }
  })
  it('allows credential-free production demo startup', () => {
    expect(() => validateLiveEnvironment({ DEMO_MODE: '1', NODE_ENV: 'production' })).not.toThrow()
  })
})
