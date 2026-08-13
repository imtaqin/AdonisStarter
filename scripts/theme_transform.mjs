/*
|--------------------------------------------------------------------------
| Shared Imtaqin -> Edge transforms
|--------------------------------------------------------------------------
|
| Used by convert-showcase-pages.mjs and by the one-off shell-partial import.
| Everything here is pure string work so it stays trivially testable.
|
*/

/**
 * Vendor files whose paths moved between the version Imtaqin shipped against and
 * the version npm installs today. Rewriting is preferable to duplicating files.
 */
const ASSET_ALIASES = {
  'libs/jsvectormap/css/jsvectormap.min.css': 'libs/jsvectormap/jsvectormap.min.css',
  'libs/jsvectormap/js/jsvectormap.min.js': 'libs/jsvectormap/jsvectormap.min.js',
  'libs/@simonwep/pickr/pickr.es5.min.js': 'libs/@simonwep/pickr/pickr.min.js',
}

/**
 * The template loads its DataTables stack from public CDNs. Two problems with
 * that: the Content-Security-Policy in config/shield.ts only allows 'self', so
 * every one of these is blocked and the table silently never initialises; and a
 * scaffold should not need the internet to render.
 *
 * These packages are vendored into public/theme/libs, so the CDN URLs are
 * rewritten to local paths. Re-run `npm run theme:vendor-datatables` if the
 * files ever go missing.
 */
const CDN_REWRITES = {
  'https://cdn.datatables.net/1.12.1/js/jquery.dataTables.min.js':
    '/theme/libs/datatables.net/js/jquery.dataTables.min.js',
  'https://cdn.datatables.net/1.12.1/js/dataTables.bootstrap5.min.js':
    '/theme/libs/datatables.net-bs5/js/dataTables.bootstrap5.min.js',
  'https://cdn.datatables.net/1.12.1/css/dataTables.bootstrap5.min.css':
    '/theme/libs/datatables.net-bs5/css/dataTables.bootstrap5.min.css',
  'https://cdn.datatables.net/responsive/2.3.0/js/dataTables.responsive.min.js':
    '/theme/libs/datatables.net-responsive/js/dataTables.responsive.min.js',
  'https://cdn.datatables.net/responsive/2.3.0/css/responsive.bootstrap.min.css':
    '/theme/libs/datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css',
  'https://cdn.datatables.net/buttons/2.2.3/js/dataTables.buttons.min.js':
    '/theme/libs/datatables.net-buttons/js/dataTables.buttons.min.js',
  'https://cdn.datatables.net/buttons/2.2.3/js/buttons.html5.min.js':
    '/theme/libs/datatables.net-buttons/js/buttons.html5.min.js',
  'https://cdn.datatables.net/buttons/2.2.3/js/buttons.print.min.js':
    '/theme/libs/datatables.net-buttons/js/buttons.print.min.js',
  'https://cdn.datatables.net/buttons/2.2.3/css/buttons.bootstrap5.min.css':
    '/theme/libs/datatables.net-buttons-bs5/css/buttons.bootstrap5.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js':
    '/theme/libs/jszip/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.6/pdfmake.min.js':
    '/theme/libs/pdfmake/pdfmake.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js':
    '/theme/libs/pdfmake/vfs_fonts.js',
  'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js':
    '/theme/libs/select2/js/select2.min.js',
  'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css':
    '/theme/libs/select2/css/select2.min.css',
}

/**
 * DataTables and Select2 are jQuery plugins, and the theme's own init scripts
 * are written in `$(...)` style — but the template never loads jQuery on these
 * pages, because its CDN bundle pulled it in implicitly.
 *
 * Any page that uses one of these gets a jQuery tag injected ahead of them.
 * Without it the page loads clean and the table simply never appears, which is
 * a miserable thing to debug.
 */
const NEEDS_JQUERY = ['datatables.net', 'select2/js']
const JQUERY_TAG = '<script src="/theme/libs/jquery/jquery.min.js"></script>'

/** Template pages that do not become showcase routes. */
export const STANDALONE_PAGES = new Set([
  '404-error',
  '500-error',
  'constuction',
  'creat-password',
  'forgot-password',
  'lock-screen',
  'sign-in',
  'sign-up',
])

/** Template pages replaced by real application screens. */
export const REPLACED_PAGES = new Set(['index'])

/** Slugs that differ from the template's file name. */
const SLUG_OVERRIDES = {
  'index2': 'dashboard-2',
  'index3': 'dashboard-3',
  'index4': 'dashboard-4',
  'index5': 'dashboard-5',
  'constuction': 'under-construction',
  'creat-password': 'create-password',
  '404-error': '404',
  '500-error': '500',
}

/** Template pages that map onto real application routes rather than showcase ones. */
const REAL_ROUTES = {
  'index': '/',
  'sign-in': '/login',
  'sign-up': '/signup',
  'forgot-password': '/forgot-password',
}

export function slugify(fileName) {
  const base = fileName
    .replace(/\.html$/i, '')
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return SLUG_OVERRIDES[base] ?? base
}

/** Maps a template file name to the URL it should live at in the app. */
export function urlFor(fileName) {
  const raw = fileName.replace(/\.html$/i, '').toLowerCase()
  if (raw in REAL_ROUTES) return REAL_ROUTES[raw]
  return `/showcase/${slugify(fileName)}`
}

/**
 * Rewrites asset URLs, internal page links, and escapes the handful of literal
 * `@word` sequences that Edge would otherwise try to parse as tags.
 */
export function transformMarkup(html) {
  let out = html

  // ../assets/... -> /theme/...   (the theme lives outside Vite's build dir)
  out = out.replace(/(\.\.\/)+assets\//g, '/theme/')
  out = out.replace(/(["'(])\/assets\//g, '$1/theme/')

  for (const [from, to] of Object.entries(ASSET_ALIASES)) {
    out = out.split(`/theme/${from}`).join(`/theme/${to}`)
  }

  // CDN -> vendored copies, so CSP does not block them
  for (const [from, to] of Object.entries(CDN_REWRITES)) {
    out = out.split(from).join(to)
  }

  // internal page links -> app routes
  out = out.replace(
    /(href=")([A-Za-z0-9_'&.\-]+\.html)(")/g,
    (_m, a, file, b) => `${a}${urlFor(file)}${b}`
  )

  // Edge parses a line-leading `@word` as a tag; `@@` renders a literal `@`.
  out = out.replace(/^(\s*)@(?=[a-zA-Z])/gm, '$1@@')

  return out
}

/**
 * Prepends jQuery when the block uses a jQuery plugin and does not already
 * load it. Applied to the extracted <script> region of a page.
 */
export function ensureJquery(scriptBlock) {
  if (!scriptBlock.trim()) return scriptBlock
  if (scriptBlock.includes('jquery/jquery.min.js')) return scriptBlock
  if (!NEEDS_JQUERY.some((lib) => scriptBlock.includes(lib))) return scriptBlock

  return `\n<!-- jQuery: required by the plugins below -->\n${JQUERY_TAG}\n${scriptBlock}`
}

/**
 * Returns the index just past the balanced closing tag for the element opening
 * at `pos`, plus the index of that closing tag itself.
 */
export function matchClose(src, pos, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}\\s*>`, 'gi')
  re.lastIndex = pos
  let depth = 0
  let m
  while ((m = re.exec(src))) {
    // self-closing shouldn't occur for div/ul, but guard anyway
    depth += m[0].startsWith('</') ? -1 : 1
    if (depth === 0) return { close: m.index, next: re.lastIndex }
  }
  throw new Error(`unbalanced <${tag}>`)
}

/** Strips one level of leading indentation so generated Edge reads cleanly. */
export function reindent(block, indent = '  ') {
  const lines = block.replace(/\s+$/, '').split('\n')
  while (lines.length && !lines[0].trim()) lines.shift()
  if (!lines.length) return ''

  const widths = lines.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length)
  const common = Math.min(...widths)

  return lines.map((l) => (l.trim() ? indent + l.slice(common) : '')).join('\n')
}
