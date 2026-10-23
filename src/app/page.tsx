import { auth } from '@/auth'
import { App } from '@/components/App'

export default async function Page() {
  const session = await auth()
  return <App viewerLogin={session?.user?.login ?? null} />
}
