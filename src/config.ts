import type { AppConfig } from '@/types/config'

export type Env = Record<string, string | undefined>

const DEFAULT_IGNORED = 'coderabbitai,sonarcloud,sonarqubecloud'

const toList = (value: string | undefined) =>
  (value ?? '').split(',').map(item => item.trim()).filter(Boolean)

function parseOverrides(value: string | undefined): Record<string, string> {
  if (!value?.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.values(parsed).some(model => typeof model !== 'string')) throw new Error('Invalid override mapping')
    return parsed as Record<string, string>
  } catch {
    throw new Error('CHARACTER_OVERRIDES must be a JSON object, e.g. {"login":"model-id"}')
  }
}

export function loadConfig(env: Env = process.env): AppConfig {
  const token = required(env, 'GITHUB_TOKEN')
  const org = required(env, 'GITHUB_ORG')
  return {
    token,
    org,
    ctoLogin: env.CTO_LOGIN?.trim() ?? '',
    ignoredLogins: toList(env.IGNORED_LOGINS ?? DEFAULT_IGNORED),
    excludedLogins: toList(env.EXCLUDED_LOGINS),
    characterOverrides: parseOverrides(env.CHARACTER_OVERRIDES),
  }
}

function required(env: Env, name: string): string {
  const value = env[name]?.trim()
  if (!value) throw new Error(`${name} is not set`)
  return value
}

export function demoMode(env: Env = process.env): boolean {
  return env.DEMO_MODE === '1'
}

/** Validate server startup separately so recording and token scripts need no OAuth credentials. */
export function validateLiveEnvironment(env: Env = process.env): void {
  if (demoMode(env)) return
  loadConfig(env)
  for (const name of ['AUTH_SECRET', 'AUTH_GITHUB_ID', 'AUTH_GITHUB_SECRET']) required(env, name)
}
