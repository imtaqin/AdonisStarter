/*
|--------------------------------------------------------------------------
| Vendor Font Awesome Pro into the theme
|--------------------------------------------------------------------------
|
| The downloaded Pro bundle is ~1.1GB and ships 17 webfonts covering every
| family and weight. Shipping all of them costs 5.8MB for styles nothing uses,
| so this builds a subset: one concatenated stylesheet plus only the woff2 files
| that stylesheet actually references.
|
|   npm run theme:fontawesome
|
| To add a style, put it in STYLES below and re-run. The font copy step reads
| the generated CSS, so the fonts always match the styles — there is no second
| list to keep in sync.
|
| Font Awesome Pro is commercial software. The source bundle stays git-ignored
| because of its size; LICENSE.txt is copied next to the vendored files.
|
*/
import fs from 'node:fs'
import path from 'node:path'

/**
 * Families to ship, in cascade order.
 *
 * Dropped on purpose:
 *   thin       — a 396KB weight that reads poorly at UI sizes
 *   sharp-*    — 8 files, 2.6MB, a stylistic alternative to the classic family
 *
 * Add either back by listing it here (e.g. 'sharp-solid') and re-running.
 * Every name must match a file in the bundle's css/ directory.
 */
const STYLES = ['solid', 'regular', 'light', 'duotone', 'brands']

const ROOT = path.resolve(import.meta.dirname, '..')
const DEST = path.join(ROOT, 'public/theme/fontawesome')
const INDEX_OUT = path.join(ROOT, 'mcp/boost/data/fontawesome-index.json')

/**
 * Where to look for the unpacked bundle.
 *
 * Keep it OUTSIDE the project. The bundle contains ~200k SVG files, and the dev
 * server's file watcher will try to watch every one of them and die with
 * `ENOSPC: System limit for number of file watchers reached`. Sibling
 * directories are checked first for that reason.
 */
const SEARCH_PATHS = [
  path.resolve(ROOT, '../fontawesome-pro-7.2.0-web'),
  path.resolve(ROOT, '../../fontawesome-pro-7.2.0-web'),
  path.join(ROOT, 'fontawesome-pro-7.2.0-web'),
]

const SOURCE = SEARCH_PATHS.find((candidate) => fs.existsSync(candidate))

if (!SOURCE) {
  console.error(
    'Font Awesome Pro bundle not found. Looked in:\n' +
      SEARCH_PATHS.map((p) => `  ${p}`).join('\n') +
      '\n\nDownload it from fontawesome.com (Pro > Download > For the Web) and unzip it\n' +
      'into the parent directory of this project.'
  )
  process.exit(1)
}

if (SOURCE.startsWith(ROOT)) {
  console.warn(
    'WARNING: the bundle is inside the project. The dev server watcher will hit the\n' +
      '         inotify limit on its ~200k SVG files. Move it to the parent directory.\n'
  )
}

/* -------------------------------------------------------------------------- */
/* 1. Stylesheet: core + the selected families, concatenated                   */
/* -------------------------------------------------------------------------- */

// Start clean so a removed style does not leave its font behind.
fs.rmSync(DEST, { recursive: true, force: true })
fs.mkdirSync(path.join(DEST, 'css'), { recursive: true })
fs.mkdirSync(path.join(DEST, 'webfonts'), { recursive: true })

const parts = []

// fontawesome.min.css is the base layer (sizing, rotation, stacking, `.fa-fw`)
// and references no fonts of its own.
parts.push(fs.readFileSync(path.join(SOURCE, 'css/fontawesome.min.css'), 'utf8'))

for (const style of STYLES) {
  const sheet = path.join(SOURCE, `css/${style}.min.css`)
  if (!fs.existsSync(sheet)) {
    console.error(`Unknown style "${style}" — no css/${style}.min.css in the bundle.`)
    process.exit(1)
  }
  parts.push(fs.readFileSync(sheet, 'utf8'))
}

const css = parts.join('\n')
const cssPath = path.join(DEST, 'css/fontawesome.min.css')
fs.writeFileSync(cssPath, css)
fs.copyFileSync(path.join(SOURCE, 'LICENSE.txt'), path.join(DEST, 'LICENSE.txt'))

/* -------------------------------------------------------------------------- */
/* 2. Webfonts: exactly the files the generated CSS asks for                   */
/* -------------------------------------------------------------------------- */

const referenced = [
  ...new Set([...css.matchAll(/webfonts\/([a-z0-9.-]+\.woff2)/g)].map((m) => m[1])),
]

let fontBytes = 0
for (const file of referenced) {
  const from = path.join(SOURCE, 'webfonts', file)
  if (!fs.existsSync(from)) {
    console.error(`CSS references webfonts/${file} but it is not in the bundle.`)
    process.exit(1)
  }
  fs.copyFileSync(from, path.join(DEST, 'webfonts', file))
  fontBytes += fs.statSync(from).size
}

/* -------------------------------------------------------------------------- */
/* 3. Search index for the `search_icons` MCP tool                            */
/* -------------------------------------------------------------------------- */

/**
 * metadata/icons.json is 36MB. Parsing it per query would make the tool
 * unusable, so it is reduced once to name + label + styles + synonyms. Only
 * icons available in a shipped style are indexed — suggesting an icon the app
 * cannot render is worse than not suggesting it.
 */
const raw = JSON.parse(fs.readFileSync(path.join(SOURCE, 'metadata/icons.json'), 'utf8'))
const shipped = new Set(STYLES)

const index = {}
let skipped = 0

for (const [name, meta] of Object.entries(raw)) {
  const styles = (meta.styles ?? []).filter((style) => shipped.has(style))
  if (styles.length === 0) {
    skipped++
    continue
  }

  index[name] = {
    l: meta.label ?? name,
    s: styles,
    t: [...new Set(meta.search?.terms ?? [])].filter((term) => term !== name),
  }
}

fs.mkdirSync(path.dirname(INDEX_OUT), { recursive: true })
fs.writeFileSync(INDEX_OUT, JSON.stringify(index))

/* -------------------------------------------------------------------------- */

const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`
const sizeOf = (file) => fs.statSync(file).size

console.log(`Font Awesome Pro 7.2.0 — styles: ${STYLES.join(', ')}`)
console.log(`  css/fontawesome.min.css   ${mb(sizeOf(cssPath))}`)
console.log(`  webfonts/                 ${referenced.length} files, ${mb(fontBytes)}`)
console.log(
  `  search index              ${Object.keys(index).length} icons, ${mb(sizeOf(INDEX_OUT))}`
)
console.log(`  total shipped             ${mb(sizeOf(cssPath) + fontBytes)}`)
if (skipped) {
  console.log(`  ${skipped} icons skipped — not available in any shipped style.`)
}
