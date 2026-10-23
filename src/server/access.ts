import { demoMode, loadConfig, type Env } from '@/config'
import { isOrgMember } from '@/github/membership'

export type MembershipCheck = (login: string) => Promise<boolean>

export const ACCESS_TTL_MS = 600_000

export function createAccessCheck(isMember: MembershipCheck, ttlMs = ACCESS_TTL_MS, clock: () => number = Date.now) {
  const cache = new Map<string, { allowed: boolean; at: number }>()
  return async (login: string): Promise<boolean> => {
    const key = login.toLowerCase()
    const hit = cache.get(key)
    if (hit && clock() - hit.at < ttlMs) return hit.allowed
    try {
      const allowed = await isMember(login)
      cache.set(key, { allowed, at: clock() })
      return allowed
    } catch (error) {
      console.error('membership check failed', error)
      return false
    }
  }
}

let check: MembershipCheck | null = null

export function checkAccess(login: string): Promise<boolean> {
  check ??= createAccessCheck(user => {
    const config = loadConfig()
    return isOrgMember(config.token, config.org, user)
  })
  return check(login)
}

export function bypassAuth(env: Record<string, string | undefined> = process.env, hostname?: string): boolean {
  return env.E2E_BYPASS_AUTH === '1'
    && env.NODE_ENV !== 'production'
    && ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname ?? '')
    && !['VERCEL', 'NETLIFY', 'RENDER', 'FLY_APP_NAME'].some(name => Boolean(env[name]))
}

export function authorizeRequest(pathname: string, hasSession: boolean, env: Env = process.env, hostname?: string): boolean {
  if (demoMode(env)) return pathname === '/' || pathname === '/api/replay/demo'
  return bypassAuth(env, hostname) || hasSession
}
