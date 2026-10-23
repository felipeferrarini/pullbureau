import { demoMode } from '@/config'
import { parsePrParams } from '@/server/prParams'
import { getThread } from '@/server/state'

export async function GET(_request: Request, { params }: { params: Promise<{ repo: string; number: string }> }) {
  if (demoMode()) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const { repo, number } = await params
  const key = parsePrParams(repo, number)
  if (!key) return Response.json({ error: 'bad_request' }, { status: 400 })
  try {
    const thread = await getThread(key.repo, key.number)
    return thread ? Response.json(thread) : Response.json({ error: 'not_found' }, { status: 404 })
  } catch (error) {
    console.error('thread failed', error)
    return Response.json({ error: 'github_unavailable' }, { status: 503 })
  }
}
