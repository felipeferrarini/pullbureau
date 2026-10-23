import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Logger, NodeIO, getBounds, type Document } from '@gltf-transform/core'
import type { PropKit, PropManifestEntry, PropSize, PropSource } from '../src/types/props'

const assetsDir = process.argv[2] ?? process.env.ASSET_DIR
if (!assetsDir) throw new Error('Provide a source directory as the first argument or set ASSET_DIR; see public/CREDITS.md')
const outDir = 'public/models/props'
const hdriDir = 'public/hdri'
const manifestPath = 'src/shared/props.generated.json'
const SIZE_TOLERANCE = 0.02

const KIT_DIRS: Record<PropKit, string> = {
  'furniture-kit': 'kenney-furniture-kit/extracted/Models/GLTF format',
  'car-kit': 'kenney-car-kit/extracted/Models/GLB format',
  'nature-kit': 'kenney-nature-kit/extracted/Models/GLTF format',
  'city-kit-commercial': 'kenney-city-kit-commercial/extracted/Models/GLB format',
  'city-kit-suburban': 'kenney-city-kit-suburban/extracted/Models/GLB format',
  'city-kit-roads': 'kenney-city-kit-roads/extracted/Models/GLB format',
}

const HDRIS = ['kloofendal_43d_clear_puresky_1k.hdr', 'kloppenheim_02_puresky_1k.hdr']

// Kenney units are not meters: furniture is ~1:2, nature/city pieces sit on 1-unit tiles.
const FURNITURE = 2
const CAR = 1.25
const TREE = 4
const BUSH = 3
const GROUND_COVER = 2
const CITY = 8

const furniture = (id: string, model: string, category: PropSource['category']): PropSource =>
  ({ id, kit: 'furniture-kit', model, category, scale: FURNITURE })
const car = (id: string, model: string): PropSource =>
  ({ id, kit: 'car-kit', model, category: 'vehicle', scale: CAR, keepNodes: true })
const nature = (id: string, model: string, scale: number): PropSource =>
  ({ id, kit: 'nature-kit', model, category: 'nature', scale })
const city = (id: string, kit: PropKit, model: string, category: PropSource['category']): PropSource =>
  ({ id, kit, model, category, scale: CITY })

const PROPS: PropSource[] = [
  furniture('chair-office', 'chairDesk', 'office'),
  furniture('chair-waiting', 'chairCushion', 'furniture'),
  furniture('chair-plain', 'chair', 'furniture'),
  furniture('bench-waiting', 'benchCushion', 'furniture'),
  furniture('bench-wood', 'bench', 'furniture'),
  furniture('desk', 'desk', 'office'),
  furniture('desk-corner', 'deskCorner', 'office'),
  furniture('table', 'table', 'furniture'),
  furniture('computer-screen', 'computerScreen', 'office'),
  furniture('computer-keyboard', 'computerKeyboard', 'office'),
  furniture('computer-mouse', 'computerMouse', 'office'),
  furniture('laptop', 'laptop', 'office'),
  furniture('bookcase-closed', 'bookcaseClosedDoors', 'office'),
  furniture('bookcase-open', 'bookcaseOpen', 'office'),
  furniture('drawers-side', 'sideTableDrawers', 'office'),
  furniture('box-closed', 'cardboardBoxClosed', 'office'),
  furniture('box-open', 'cardboardBoxOpen', 'office'),
  furniture('books', 'books', 'office'),
  furniture('trash-bin', 'trashcan', 'furniture'),
  furniture('plant-potted', 'pottedPlant', 'decor'),
  furniture('plant-small-a', 'plantSmall1', 'decor'),
  furniture('plant-small-b', 'plantSmall2', 'decor'),
  furniture('ceiling-fan', 'ceilingFan', 'decor'),
  furniture('lamp-ceiling', 'lampSquareCeiling', 'decor'),
  furniture('lamp-floor', 'lampRoundFloor', 'decor'),
  furniture('coat-rack', 'coatRackStanding', 'decor'),
  furniture('rug', 'rugRectangle', 'decor'),
  furniture('radio', 'radio', 'decor'),
  furniture('sofa', 'loungeSofa', 'furniture'),
  furniture('armchair', 'loungeChair', 'furniture'),
  furniture('coffee-machine', 'kitchenCoffeeMachine', 'kitchen'),
  furniture('kitchen-cabinet', 'kitchenCabinet', 'kitchen'),
  furniture('kitchen-cabinet-upper', 'kitchenCabinetUpper', 'kitchen'),
  furniture('kitchen-sink', 'kitchenSink', 'kitchen'),
  furniture('fridge-small', 'kitchenFridgeSmall', 'kitchen'),
  furniture('microwave', 'kitchenMicrowave', 'kitchen'),
  car('car-sedan', 'sedan'),
  car('car-taxi', 'taxi'),
  car('car-police', 'police'),
  car('car-van', 'van'),
  car('car-suv', 'suv'),
  car('truck-delivery', 'delivery'),
  nature('tree-oak', 'tree_oak', TREE),
  nature('tree-default', 'tree_default', TREE),
  nature('tree-detailed', 'tree_detailed', TREE),
  nature('tree-fat', 'tree_fat', TREE),
  nature('tree-palm', 'tree_palmTall', TREE),
  nature('bush', 'plant_bush', BUSH),
  nature('bush-detailed', 'plant_bushDetailed', BUSH),
  nature('grass', 'grass', GROUND_COVER),
  nature('grass-large', 'grass_large', GROUND_COVER),
  nature('flower-red', 'flower_redA', GROUND_COVER),
  nature('flower-yellow', 'flower_yellowA', GROUND_COVER),
  nature('flower-purple', 'flower_purpleA', GROUND_COVER),
  nature('rock-small', 'rock_smallA', BUSH),
  nature('planter-large', 'pot_large', BUSH),
  city('road-straight', 'city-kit-roads', 'road-straight', 'road'),
  city('road-crossing', 'city-kit-roads', 'road-crossing', 'road'),
  city('road-crossroad', 'city-kit-roads', 'road-crossroad', 'road'),
  city('road-intersection', 'city-kit-roads', 'road-intersection', 'road'),
  city('road-bend', 'city-kit-roads', 'road-bend', 'road'),
  city('sidewalk-tile', 'city-kit-roads', 'tile-low', 'road'),
  city('street-lamp', 'city-kit-roads', 'light-square', 'street'),
  city('street-lamp-curved', 'city-kit-roads', 'light-curved', 'street'),
  city('traffic-light', 'city-kit-roads', 'traffic-light', 'street'),
  city('dumpster', 'city-kit-roads', 'dumpster', 'street'),
  city('parasol', 'city-kit-commercial', 'detail-parasol-a', 'street'),
  city('awning', 'city-kit-commercial', 'detail-awning', 'street'),
  city('building-commercial-a', 'city-kit-commercial', 'building-a', 'building'),
  city('building-commercial-b', 'city-kit-commercial', 'building-f', 'building'),
  city('building-commercial-c', 'city-kit-commercial', 'building-g', 'building'),
  city('building-commercial-d', 'city-kit-commercial', 'building-c', 'building'),
  city('building-skyscraper-a', 'city-kit-commercial', 'building-skyscraper-a', 'building'),
  city('building-suburban-a', 'city-kit-suburban', 'building-type-a', 'building'),
  city('building-suburban-b', 'city-kit-suburban', 'building-type-d', 'building'),
]

const round = (value: number) => Number(value.toFixed(3))

function sceneOf(doc: Document) {
  const root = doc.getRoot()
  const scene = root.getDefaultScene() ?? root.listScenes()[0]
  if (!scene) throw new Error('model has no scene')
  return scene
}

function normalize(doc: Document, prop: PropSource): PropSize {
  const scene = sceneOf(doc)
  const { min, max } = getBounds(scene)
  const s = prop.scale
  const wrapper = doc.createNode(prop.id)
    .setScale([s, s, s])
    .setTranslation([-((min[0] + max[0]) / 2) * s, -min[1] * s, -((min[2] + max[2]) / 2) * s])
  for (const child of scene.listChildren()) {
    scene.removeChild(child)
    wrapper.addChild(child)
  }
  scene.addChild(wrapper)
  return [0, 1, 2].map(axis => round((max[axis] - min[axis]) * s)) as PropSize
}

function nodeNames(doc: Document) {
  return doc.getRoot().listNodes().map(node => node.getName()).filter(Boolean)
}

function optimize(src: string, out: string, keepNodes: boolean) {
  const graph = keepNodes ? ['--flatten', 'false', '--join', 'false'] : []
  execFileSync('pnpm', ['exec', 'gltf-transform', 'optimize', src, out,
    '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '256',
    '--simplify', 'false', '--instance', 'false', ...graph], { stdio: 'ignore' })
}

function outputBounds(file: string) {
  const csv = execFileSync('pnpm', ['exec', 'gltf-transform', 'inspect', file, '--format', 'csv'], { encoding: 'utf8' })
  const row = csv.split('\n').find(line => /^0,/.test(line) && line.includes('"'))
  const vectors = row?.match(/"([^"]+)"/g)?.map(v => v.replaceAll('"', '').split(',').map(Number))
  if (!vectors || vectors.length < 2) throw new Error(`could not read bounds of ${file}`)
  return { min: vectors[0], max: vectors[1] }
}

function verify(file: string, size: PropSize) {
  const { min, max } = outputBounds(file)
  const actual = [0, 1, 2].map(axis => max[axis] - min[axis])
  const centered = Math.abs(min[0] + max[0]) / 2 < SIZE_TOLERANCE * Math.max(1, size[0])
    && Math.abs(min[2] + max[2]) / 2 < SIZE_TOLERANCE * Math.max(1, size[2])
    && Math.abs(min[1]) < SIZE_TOLERANCE
  const sized = actual.every((value, axis) => Math.abs(value - size[axis]) <= SIZE_TOLERANCE * Math.max(1, size[axis]))
  if (!centered || !sized) throw new Error(`${file}: unexpected bounds ${JSON.stringify({ min, max })}`)
}

async function importProp(io: NodeIO, workDir: string, prop: PropSource): Promise<PropManifestEntry> {
  const src = path.join(assetsDir, KIT_DIRS[prop.kit], `${prop.model}.glb`)
  const doc = await io.read(src)
  const size = normalize(doc, prop)
  const normalized = path.join(workDir, `${prop.id}.glb`)
  await io.write(normalized, doc)
  const out = path.join(outDir, `${prop.id}.glb`)
  optimize(normalized, out, prop.keepNodes ?? false)
  verify(out, size)
  const entry: PropManifestEntry = { id: prop.id, file: `/models/props/${prop.id}.glb`, category: prop.category, size }
  return prop.keepNodes ? { ...entry, nodes: nodeNames(doc).filter(name => name !== prop.id) } : entry
}

function copyHdris() {
  mkdirSync(hdriDir, { recursive: true })
  for (const name of HDRIS) copyFileSync(path.join(assetsDir, 'polyhaven-hdri', name), path.join(hdriDir, name))
}

async function main() {
  mkdirSync(outDir, { recursive: true })
  const workDir = mkdtempSync(path.join(tmpdir(), 'pullbureau-props-'))
  const io = new NodeIO().setLogger(new Logger(Logger.Verbosity.ERROR))
  try {
    const manifest: PropManifestEntry[] = []
    for (const prop of PROPS) manifest.push(await importProp(io, workDir, prop))
    copyHdris()
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    console.table(manifest.map(m => ({
      id: m.id, category: m.category, size: m.size.join(' x '), kb: Math.round(statSync(`public${m.file}`).size / 1024),
    })))
  } finally {
    rmSync(workDir, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
