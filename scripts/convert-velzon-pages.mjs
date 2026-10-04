/*
|--------------------------------------------------------------------------
| Velzon HTML -> Edge showcase pages
|--------------------------------------------------------------------------
|
| Regenerates resources/views/pages/velzon/*.edge from the Velzon dist. The
| output is disposable: edit this script, not the generated files.
|
|   npm run theme:velzon-pages
|
| Unlike the Imtaqin template, Velzon's dist is already expanded -- there are no
| @SPK@include directives to resolve. Each page is a complete document, so the
| work here is extraction: pull the page body out of the shell, drop the parts
| our layout already draws, and keep the per-page <link> and <script> tags.
|
| These pages always render in the Velzon shell, whatever theme the viewer has
| chosen. They are a catalogue of that template; showing them under Imtaqin's
| stylesheet would misrepresent what the markup looks like.
*/
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { matchClose, reindent, slugify } from './theme_transform.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'resources/views/pages/velzon')
const CONFIG = path.join(ROOT, 'config/velzon_showcase.ts')

const SEARCH_PATHS = [
  path.resolve(ROOT, '../vendor-templates/velzon/HTML/Admin/dist/default'),
  path.resolve(ROOT, '../../vendor-templates/velzon/HTML/Admin/dist/default'),
]

/** Loaded by the shell already; a page repeating them would double-fetch. */
const CORE_CSS = [
  'css/bootstrap.min.css',
  'css/icons.min.css',
  'css/app.min.css',
  'css/custom.min.css',
]

const CORE_JS = [
  'libs/bootstrap/js/bootstrap.bundle.min.js',
  'libs/simplebar/simplebar.min.js',
  'libs/node-waves/waves.min.js',
  'libs/feather-icons/feather.min.js',
  'js/app.js',
  'js/layout.js',
  /*
   * plugins.js pulls toastify from jsdelivr at runtime, which the Content
   * Security Policy blocks, and resolves other URLs relative to the current
   * path. The shell does not load it and neither should a page.
   */
  'js/plugins.js',
]

/**
 * Pages that are their own full-screen document -- sign-in, 404, landing, the
 * email templates. They have no .page-content to extract, and wrapping them in
 * the dashboard shell would be wrong anyway.
 */
const SKIP =
  /^(auth-|pages-404|pages-500|pages-offline|pages-coming-soon|pages-maintenance|landing|nft-landing|job-landing|email-template|index-rtl)/

function findSource() {
  for (const candidate of SEARCH_PATHS) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) return candidate
  }
  return null
}

/** Rewrites the template's relative asset URLs onto the vendored tree. */
function rewriteAssets(html) {
  return html
    .replace(/(["'(])assets\//g, '$1/theme-velzon/shared/')
    .replace(/(["'(])\.\/assets\//g, '$1/theme-velzon/shared/')
}

/** Internal demo links point at pages that only exist inside this catalogue. */
function rewriteLinks(html) {
  return html.replace(
    /(href=")([A-Za-z0-9_.\-]+)\.html(["#])/g,
    (_m, a, file, b) => `${a}/velzon/${slugify(file)}${b}`
  )
}

function extractHeadExtras(html) {
  const head = html.slice(0, html.search(/<\/head>/i))
  const out = []

  for (const m of head.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)) {
    const tag = m[0]
    if (CORE_CSS.some((core) => tag.includes(core))) continue
    out.push(tag.trim())
  }

  for (const m of head.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)) {
    out.push(m[0])
  }

  return out.join('\n')
}

function extractScripts(html) {
  const start = html.search(/<!--\s*JAVASCRIPT\s*-->/i)
  if (start === -1) return ''

  const region = html.slice(start, html.search(/<\/body>/i))
  const out = []

  for (const m of region.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)) {
    const tag = m[0]
    const src = tag.match(/src=["']([^"']+)["']/)

    if (src) {
      if (CORE_JS.some((core) => src[1].includes(core))) continue
      out.push(tag.trim())
    } else if (tag.replace(/<\/?script[^>]*>/gi, '').trim()) {
      out.push(tag)
    }
  }

  return out.join('\n')
}

/**
 * The page body: what sits inside `.page-content > .container-fluid`, minus the
 * title/breadcrumb row, which the layout draws from the props instead.
 */
function extractBody(html, file) {
  const contentAt = html.search(/<div class="page-content">/i)
  if (contentAt === -1) return null

  const containerAt = html.indexOf('<div class="container-fluid">', contentAt)
  if (containerAt === -1) return null

  const { close } = matchClose(html, containerAt, 'div')
  const open = html.indexOf('>', containerAt) + 1
  let body = html.slice(open, close)

  // Drop the `.row` that wraps `.page-title-box`.
  const titleAt = body.search(/<div class="page-title-box/i)
  if (titleAt !== -1) {
    const rowAt = body.lastIndexOf('<div class="row">', titleAt)
    if (rowAt !== -1) {
      const row = matchClose(body, rowAt, 'div')
      body = body.slice(0, rowAt) + body.slice(row.next)
    }
  }

  if (!body.trim()) {
    console.warn(`  ${file}: empty body after extraction`)
    return null
  }

  return body
}

function extractTitle(html, file) {
  const h4 = html.match(/<div class="page-title-box[\s\S]*?<h4[^>]*>([\s\S]*?)<\/h4>/i)
  const title = h4 ? h4[1].replace(/<[^>]+>/g, '').trim() : ''

  const crumb = html.match(
    /<div class="page-title-box[\s\S]*?<ol class="breadcrumb[\s\S]*?<li class="breadcrumb-item[^"]*">\s*(?:<a[^>]*>)?([\s\S]*?)(?:<\/a>)?\s*<\/li>/i
  )
  const subtitle = crumb ? crumb[1].replace(/<[^>]+>/g, '').trim() : ''

  return {
    title:
      title ||
      slugify(file)
        .replace(/-/g, ' ')
        .replace(/^./, (c) => c.toUpperCase()),
    subtitle: subtitle && subtitle !== title ? subtitle : 'Velzon',
  }
}

/** Single-quoted Edge prop values need their quotes escaped. */
function q(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

const source = findSource()
if (!source) {
  console.error('Velzon dist not found. Looked in:')
  for (const candidate of SEARCH_PATHS) console.error(`  ${candidate}`)
  console.error('\nExtract HTML.zip outside this project first -- see scripts/vendor-velzon.mjs.')
  process.exit(1)
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const files = fs
  .readdirSync(source)
  .filter((f) => f.endsWith('.html'))
  .sort()

const written = []
const skipped = []

for (const file of files) {
  const slug = slugify(file)

  if (SKIP.test(file.replace(/\.html$/, ''))) {
    skipped.push(`${slug} (standalone page)`)
    continue
  }

  const raw = fs.readFileSync(path.join(source, file), 'utf8')
  const body = extractBody(raw, file)
  if (!body) {
    skipped.push(`${slug} (no .page-content)`)
    continue
  }

  const { title, subtitle } = extractTitle(raw, file)
  const styles = extractHeadExtras(raw)
  const scripts = extractScripts(raw)

  const parts = [
    `{{--`,
    `  GENERATED by scripts/convert-velzon-pages.mjs from the Velzon dist.`,
    `  Do not edit -- change the script and re-run \`npm run theme:velzon-pages\`.`,
    `--}}`,
    ``,
    `@layouts.themes.velzon({ title: '${q(title)}', subtitle: '${q(subtitle)}' })`,
    reindent(rewriteLinks(rewriteAssets(body))),
  ]

  if (styles.trim()) {
    parts.push(`  @slot('styles')`, reindent(rewriteAssets(styles), '    '), `  @end`)
  }

  if (scripts.trim()) {
    parts.push(`  @slot('scripts')`, reindent(rewriteAssets(scripts), '    '), `  @end`)
  }

  parts.push(`@end`, ``)

  fs.writeFileSync(path.join(OUT, `${slug}.edge`), parts.join('\n'))
  written.push({ slug, title })
}

/* The allowlist the controller checks `:page` against before rendering. */
fs.writeFileSync(
  CONFIG,
  `/*
|--------------------------------------------------------------------------
| Velzon showcase pages
|--------------------------------------------------------------------------
|
| GENERATED by scripts/convert-velzon-pages.mjs -- do not edit by hand.
|
| The controller checks \`:page\` against this set before passing it to
| \`view.render()\`. Without that check the parameter would select a template by
| path, which is a file disclosure bug waiting to happen (OWASP A01).
|
*/

export const VELZON_PAGES = ${JSON.stringify(
    written.map((p) => p.slug),
    null,
    2
  )} as const

export type VelzonPage = (typeof VELZON_PAGES)[number]

export const velzonPageSet: ReadonlySet<string> = new Set(VELZON_PAGES)

/** Title per page, for the index listing. */
export const VELZON_PAGE_TITLES: Record<string, string> = ${JSON.stringify(
    Object.fromEntries(written.map((p) => [p.slug, p.title])),
    null,
    2
  )}
`
)

console.log(`Velzon showcase pages generated from ${source}`)
console.log(`  written ${written.length}`)
console.log(`  skipped ${skipped.length}`)
for (const s of skipped.slice(0, 12)) console.log(`    ${s}`)
if (skipped.length > 12) console.log(`    ...and ${skipped.length - 12} more`)
