import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { NodeIO, getBounds } from '@gltf-transform/core'

const srcDir = process.argv[2] ?? process.env.ASSET_DIR
if (!srcDir) throw new Error('Provide a source directory as the first argument or set ASSET_DIR; see public/CREDITS.md')
const outDir = 'public/models/characters'
const manifestPath = 'src/shared/characters.generated.json'

function findModels(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return findModels(full)
    return /\.(gltf|glb)$/i.test(name) ? [full] : []
  })
}

const slugify = (file: string) =>
  path.basename(file).replace(/\.(gltf|glb)$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function optimize(src: string, out: string) {
  execFileSync('pnpm', ['exec', 'gltf-transform', 'optimize', src, out,
    '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '512',
    '--simplify', 'false', '--join', 'false', '--flatten', 'false', '--palette', 'false'], { stdio: 'inherit' })
}

async function main() {
  mkdirSync(outDir, { recursive: true })
  const io = new NodeIO()
  const manifest = []
  for (const src of findModels(srcDir)) {
    const id = slugify(src)
    const out = path.join(outDir, `${id}.glb`)
    optimize(src, out)
    const doc = await io.read(src)
    const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]
    const { min, max } = getBounds(scene)
    manifest.push({
      id,
      file: `/models/characters/${id}.glb`,
      height: Number((max[1] - min[1]).toFixed(3)),
      animations: doc.getRoot().listAnimations().map(a => a.getName()),
    })
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.table(manifest.map(m => ({ id: m.id, height: m.height, clips: m.animations.length })))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
