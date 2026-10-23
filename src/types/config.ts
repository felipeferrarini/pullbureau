export type AppConfig = {
  token: string
  org: string
  ctoLogin: string
  ignoredLogins: string[]
  excludedLogins: string[]
  characterOverrides: Record<string, string>
}
