import { loadConfig } from '@/config'
import { completedRunTimes, fetchActionRuns } from '@/github/actions'
import { createGraphql } from '@/github/client'
import { fetchHistoryPrs, fetchOpenPrs, fetchPrThread } from '@/github/fetch'
import { isOrgMember, listOrgMembers } from '@/github/membership'
import type { RawOpenPr } from '@/types/github'

async function step<T>(label: string, run: () => Promise<T>, describe: (value: T) => string) {
  try {
    console.log(`OK   ${label}: ${describe(await run())}`)
  } catch (error) {
    console.log(`FAIL ${label}: ${(error as Error).message}`)
    process.exitCode = 1
  }
}

async function main() {
  process.loadEnvFile('.env.local')
  const config = loadConfig()
  const gql = createGraphql(config.token)
  const since = new Date(Date.now() - 30 * 86_400_000)
  let open: RawOpenPr[] = []
  await step('open PRs', async () => (open = await fetchOpenPrs(gql, config.org)), prs => `${prs.length} PRs, ci of first: ${prs[0]?.commits?.nodes?.[0]?.commit.statusCheckRollup?.state ?? 'none'}`)
  await step('history 30d', () => fetchHistoryPrs(gql, config.org, since), prs => `${prs.length} PRs`)
  const first = open[0]
  await step('thread', async () => (first ? fetchPrThread(gql, config.org, first.repository.name, first.number) : null), thread => (thread ? `${thread.comments?.nodes?.length ?? 0} comments` : 'no open PR to test'))
  await step('members', () => listOrgMembers(config.token, config.org), members => members.join(', '))
  await step('actions runs', async () => (first ? fetchActionRuns(config.token, config.org, first.repository.name, new Date(Date.now() - 86_400_000)) : []), runs => `${runs.length} runs in 24h, ${completedRunTimes(runs).size} commits with a finished run`)
  await step('membership', () => isOrgMember(config.token, config.org, config.ctoLogin), ok => `${config.ctoLogin} member=${ok}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
