import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Explicit public presentation allowlist. GitHub and OAuth credentials remain server-only.
  env: {
    DEMO_MODE: process.env.DEMO_MODE === '1' ? '1' : '0',
    LOCALE: process.env.LOCALE || 'en',
    TIME_ZONE: process.env.TIME_ZONE || 'UTC',
    BUSINESS_START_HOUR: process.env.BUSINESS_START_HOUR || '9',
    BUSINESS_END_HOUR: process.env.BUSINESS_END_HOUR || '18',
    READY_LABEL: process.env.READY_LABEL || 'ready-for-review',
    ORG_DISPLAY_NAME: process.env.ORG_DISPLAY_NAME || process.env.GITHUB_ORG || (process.env.DEMO_MODE === '1' ? 'Acme' : ''),
  },
  // The route badge sat on top of the ticker plate; compile and runtime errors still show without it.
  devIndicators: false,
  outputFileTracingIncludes: { '/api/replay/[name]': ['./fixtures/demo.json'] },
}

export default nextConfig
