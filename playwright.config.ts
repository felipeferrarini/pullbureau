import { defineConfig } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 30_000 },
  // Every page runs the software renderer on the CPU; more than two at once starves them.
  workers: 2,
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/entrar`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      DEMO_MODE: '1',
      LOCALE: process.env.LOCALE || 'en',
    },
  },
})
