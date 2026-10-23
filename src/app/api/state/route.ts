import { demoMode } from '@/config'
import { connection } from 'next/server'
import { getState } from '@/server/state'

export async function GET() {
  if (demoMode()) return Response.json({ error: 'unauthorized' }, { status: 401 })
  await connection()
  try {
    return Response.json(await getState())
  } catch (error) {
    console.error('state failed', error)
    return Response.json({ error: 'github_unavailable' }, { status: 503 })
  }
}
