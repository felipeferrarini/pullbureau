import { spawn } from 'node:child_process'

const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, DEMO_MODE: '1' },
})
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => child.kill(signal))
}
child.on('error', error => {
  console.error('Demo server failed to start:', error.message)
  process.exitCode = 1
})
child.on('exit', code => { process.exitCode = code ?? 0 })
