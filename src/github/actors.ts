import { GHOST_LOGIN } from '@/shared/constants'
import type { RawActor } from '@/types/github'

export type BotFilter = (actor: RawActor) => boolean

export function createBotFilter(ignored: string[]): BotFilter {
  const ignoredSet = new Set(ignored.map(login => login.toLowerCase()))
  return actor => {
    if (!actor) return false
    if (actor.__typename === 'Bot') return true
    const login = actor.login.toLowerCase()
    return login.endsWith('[bot]') || ignoredSet.has(login)
  }
}

export function loginOf(actor: RawActor): string {
  return actor?.login ?? GHOST_LOGIN
}
