import { demoMode } from '@/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (demoMode() && name !== 'demo') return Response.json({ error: 'unauthorized' }, { status: 401 })
  if (!/^[a-z0-9-]{1,40}$/.test(name)) return Response.json({ error: 'bad_request' }, { status: 400 })
  try {
    const raw = await readFile(path.join(process.cwd(), 'fixtures', `${name}.json`), 'utf8')
    return new Response(raw, { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }
}
