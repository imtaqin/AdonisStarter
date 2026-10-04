/**
 * Vendors the Velzon admin template into public/theme-velzon/.
 *
 * Velzon ships nine style variants (default, corporate, ... saas) as nine
 * complete 128MB asset trees. They are byte-identical except for two files:
 * `css/app.min.css` and `css/bootstrap.min.css`. Copying all nine would add
 * ~1.15GB to the repo to express about 5MB of difference.
 *
 * So this script splits them:
 *
 *   public/theme-velzon/shared/     one copy of everything the variants agree on
 *   public/theme-velzon/<variant>/  only the two CSS files that actually differ
 *
 * IMPORTANT: keep the extracted template OUTSIDE this project. The source tree
 * is ~182MB across ~3600 files, and leaving it inside the working directory
 * exhausts the inotify watch limit and kills the dev server with ENOSPC.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'theme-velzon')

/** Variant keys, in the order they should appear in the picker. */
export const VARIANTS = [
  'default',
  'corporate',
  'creative',
  'galaxy',
  'interactive',
  'material',
  'minimal',
  'modern',
  'saas',
]

/** The two files that differ per variant. Everything else is shared. */
const VARIANT_FILES = ['css/app.min.css', 'css/bootstrap.min.css']

const SEARCH_PATHS = [
  path.resolve(ROOT, '../vendor-templates/velzon/HTML/Admin/dist'),
  path.resolve(ROOT, '../../vendor-templates/velzon/HTML/Admin/dist'),
  path.resolve(ROOT, '../velzon/HTML/Admin/dist'),
]

/**
 * Demo content and libraries the dashboard does not use. Dropping these takes
 * the shared tree from ~112MB to ~70MB. Add back by deleting a line and
 * re-running; nothing else needs to change.
 */
/**
 * Library authoring sources. They are never served, and vendoring the `.ts`
 * ones puts 386 files under `public/` into `tsc --noEmit`, which then fails on
 * DOM globals the app's tsconfig does not declare.
 */
const SKIP_EXTENSIONS = new Set(['.ts', '.scss', '.sass', '.less', '.md', '.markdown'])

const SKIP_DIRS = new Set([
  'images/blog',
  'images/nft',
  'images/landing',
  'images/demos',
  'images/galaxy',
  'libs/echarts',
  'libs/@ckeditor',
])

function findSource() {
  for (const candidate of SEARCH_PATHS) {
    if (fs.existsSync(path.join(candidate, 'default', 'assets', 'css', 'app.min.css'))) {
      return candidate
    }
  }
  return null
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(base, full).split(path.sep).join('/')

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(rel)) continue
      walk(full, base, out)
    } else if (entry.isFile()) {
      out.push(rel)
    }
  }
  return out
}

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

function hash(file) {
  return createHash('sha1').update(fs.readFileSync(file)).digest('hex')
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function sizeOf(dir) {
  if (!fs.existsSync(dir)) return 0
  return walk(dir).reduce((total, rel) => total + fs.statSync(path.join(dir, rel)).size, 0)
}

const source = findSource()
if (!source) {
  console.error('Velzon source not found. Looked in:')
  for (const candidate of SEARCH_PATHS) console.error(`  ${candidate}`)
  console.error('\nExtract HTML.zip outside this project, e.g.:')
  console.error('  unzip HTML.zip -d ~/PROJECT/vendor-templates/velzon')
  console.error('\nDo NOT extract it inside the project -- ~3600 files exhausts')
  console.error('the inotify watch limit and the dev server dies with ENOSPC.')
  process.exit(1)
}

const missing = VARIANTS.filter(
  (v) => !fs.existsSync(path.join(source, v, 'assets', 'css', 'app.min.css'))
)
if (missing.length === VARIANTS.length) {
  console.error(`No variants found under ${source}`)
  process.exit(1)
}

fs.rmSync(OUT, { recursive: true, force: true })

/* ---------------------------------------------------------------------------
 * Shared tree, taken from `default`.
 * ------------------------------------------------------------------------ */

const sharedSource = path.join(source, 'default', 'assets')
const variantSet = new Set(VARIANT_FILES)
let sharedCount = 0

for (const rel of walk(sharedSource)) {
  // Source maps are build artefacts; they more than double the CSS payload.
  if (rel.endsWith('.map')) continue
  if (SKIP_EXTENSIONS.has(path.extname(rel).toLowerCase())) continue
  // Per-variant files are written per variant below, not into shared.
  if (variantSet.has(rel)) continue
  // The non-minified twins of the per-variant files would be stale here.
  if (/^css\/(app|bootstrap)(-rtl)?\.css$/.test(rel)) continue

  copy(path.join(sharedSource, rel), path.join(OUT, 'shared', rel))
  sharedCount += 1
}

/* ---------------------------------------------------------------------------
 * Strip credentials the template ships.
 *
 * Velzon's demo pages embed working API tokens -- the leaflet demo carries a
 * Mapbox access token. Committing one publishes somebody else's credential and
 * GitHub push protection rejects the push outright, so they are redacted here
 * rather than left for a reviewer to notice.
 *
 * This is a guard, not a fixed list: it re-scans on every vendoring, so a token
 * added to a future release is caught too.
 * ------------------------------------------------------------------------ */

const SECRET_PATTERNS = [
  { name: 'Mapbox token', re: /\b[ps]k\.ey[A-Za-z0-9._-]{20,}/g },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Slack token', re: /\bxox[abprs]-[0-9A-Za-z-]{10,}/g },
]

const SCANNED_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.json', '.html', '.css'])

let redacted = 0
for (const rel of walk(path.join(OUT, 'shared'))) {
  if (!SCANNED_EXTENSIONS.has(path.extname(rel).toLowerCase())) continue

  const file = path.join(OUT, 'shared', rel)
  const before = fs.readFileSync(file, 'utf8')
  let after = before

  for (const { name, re } of SECRET_PATTERNS) {
    after = after.replace(re, () => {
      console.warn(`  redacted ${name} in shared/${rel}`)
      redacted += 1
      return 'REDACTED_BY_VENDOR_SCRIPT'
    })
  }

  if (after !== before) fs.writeFileSync(file, after)
}

if (redacted > 0) {
  console.log(`  redacted ${redacted} embedded credential(s) -- demos using them will not work`)
}

/* ---------------------------------------------------------------------------
 * Make the shell tolerate the demo markup we do not ship.
 *
 * app.js assumes every element of the full Velzon demo exists and binds to them
 * unguarded -- notifications, the layout customiser, the gradient picker. The
 * whole file is one IIFE, so the first missing element throws and silently
 * takes every initialiser after it with it: that is how the sidebar toggle and
 * back-to-top stop working with no clue beyond one console error.
 *
 * Optional chaining turns each of those into a no-op instead. It changes no
 * behaviour when the element is present.
 * ------------------------------------------------------------------------ */

const appJs = path.join(OUT, 'shared', 'js', 'app.js')
if (fs.existsSync(appJs)) {
  const before = fs.readFileSync(appJs, 'utf8')
  const after = before
    .replace(/document\.getElementById\((["'][^"']+["'])\)\.addEventListener/g, 'document.getElementById($1)?.addEventListener')
    .replace(/document\.querySelector\((["'][^"']+["'])\)\.addEventListener/g, 'document.querySelector($1)?.addEventListener')

  fs.writeFileSync(appJs, after)

  const guarded = (before.match(/\)\.addEventListener/g) ?? []).length -
    (after.match(/\)\.addEventListener/g) ?? []).length
  console.log(`  guarded  ${guarded} unchecked element lookups in js/app.js`)
}

/* ---------------------------------------------------------------------------
 * Per-variant CSS.
 * ------------------------------------------------------------------------ */

const written = []
const digests = new Map()

for (const variant of VARIANTS) {
  const assets = path.join(source, variant, 'assets')
  if (!fs.existsSync(assets)) {
    console.warn(`  skipped ${variant} (not extracted)`)
    continue
  }

  for (const rel of VARIANT_FILES) {
    const from = path.join(assets, rel)
    if (!fs.existsSync(from)) {
      console.warn(`  ${variant}: missing ${rel}`)
      continue
    }
    /*
     * The variant CSS lives one directory deeper than the template assumed, so
     * its relative `url(../fonts/...)` and `url(../images/...)` references would
     * resolve to /theme-velzon/<variant>/fonts, which does not exist -- the
     * fonts and images are in the shared tree. Rewrite them to absolute paths.
     */
    const css = fs
      .readFileSync(from, 'utf8')
      .replaceAll('url(../fonts/', 'url(/theme-velzon/shared/fonts/')
      .replaceAll('url(../images/', 'url(/theme-velzon/shared/images/')

    const to = path.join(OUT, variant, rel)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.writeFileSync(to, css)
    digests.set(`${variant}/${rel}`, hash(from))
  }

  written.push(variant)
}

/* ---------------------------------------------------------------------------
 * Guard the assumption this whole script rests on.
 * ------------------------------------------------------------------------ */

const appDigests = new Set(
  written.map((variant) => digests.get(`${variant}/css/app.min.css`)).filter(Boolean)
)

if (written.length > 1 && appDigests.size === 1) {
  console.warn(
    '\nWarning: every variant produced an identical app.min.css. Either the\n' +
      'source is not a real multi-variant build, or the split is pointless.\n'
  )
}

console.log(`Velzon vendored from ${source}`)
console.log(`  shared   ${sharedCount} files, ${mb(sizeOf(path.join(OUT, 'shared')))}`)
console.log(`  variants ${written.length} (${written.join(', ')})`)
console.log(`  total    ${mb(sizeOf(OUT))}`)
