import { validateLiveEnvironment } from '@/config'

export function register() {
  validateLiveEnvironment()
}
