import { mkdirSync, writeFileSync } from 'node:fs'
import { buildDemoFixture } from '@/replay/demoBuilder'

mkdirSync('fixtures', { recursive: true })
writeFileSync('fixtures/demo.json', `${JSON.stringify(buildDemoFixture())}\n`)
console.log('saved fixtures/demo.json')
