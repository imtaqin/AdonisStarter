import { z } from 'zod'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { failure, text } from '../reply.js'

/**
 * Font Awesome Pro icon search.
 *
 * Without this, picking an icon means guessing a class name and finding out it
 * silently renders nothing — Font Awesome has no error state for an unknown
 * icon, so a typo just leaves a blank space that nobody notices until review.
 *
 * The index is built by scripts/vendor-fontawesome.mjs from the 36MB metadata
 * file, reduced to ~0.8MB and loaded once on first use.
 */

const INDEX_PATH = fileURLToPath(new URL('../data/fontawesome-index.json', import.meta.url))

type Entry = { l: string; s: string[]; t: string[] }
let index: Record<string, Entry> | null = null

function load(): Record<string, Entry> | null {
  if (index) return index
  if (!fs.existsSync(INDEX_PATH)) return null
  index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'))
  return index
}

/**
 * Font Awesome 7 needs a family class alongside the icon class. `duotone` and
 * `brands` are families in their own right; the rest are weights of the classic
 * family. Sharp variants are `fa-sharp` plus a weight.
 */
function classFor(name: string, style: string) {
  return `fa-${style} fa-${name}`
}

/**
 * Ranks an icon against one query word.
 *
 * Signals are ADDITIVE rather than first-match-wins, because the best icon is
 * usually the one that matches on several axes at once. Searching "invoice",
 * `file-invoice` matches both the name and the synonym list and so outranks
 * `receipt`, which only matches a synonym — whereas a max() score would have
 * treated them as equal and let arbitrary ordering decide.
 */
function score(name: string, entry: Entry, needle: string): number {
  const label = entry.l.toLowerCase()
  const words = name.split('-')
  let total = 0

  /**
   * Matching respects the hyphen word boundaries. A raw substring test makes
   * "edit" match `credit-card` (cr-EDIT-card), which is a nonsense result that
   * outranks the icon the user wanted.
   */
  if (name === needle) total += 100
  else if (words.includes(needle)) total += 45
  else if (words.some((word) => word.startsWith(needle))) total += 30

  if (label === needle) total += 40
  else if (label.includes(needle)) total += 12

  if (entry.t.some((term) => term === needle)) total += 40
  else if (entry.t.some((term) => term.includes(needle))) total += 8

  return total
}

export function registerIconTools(server: McpServer) {
  server.registerTool(
    'search_icons',
    {
      title: 'Search Font Awesome Pro icons',
      description:
        'Finds icons by name, label or search term and returns the exact class string to paste into a template. Use this instead of guessing a class name — Font Awesome renders an unknown icon as blank space with no error.',
      inputSchema: {
        query: z
          .string()
          .describe('What the icon should depict, e.g. "delete", "invoice", "user settings"'),
        style: z
          .enum(['solid', 'regular', 'light', 'duotone', 'brands'])
          .optional()
          .describe('Preferred weight/family. Defaults to solid when the icon has it.'),
        limit: z.number().int().min(1).max(50).optional().describe('Default 12'),
      },
    },
    async ({ query, style, limit }) => {
      const icons = load()
      if (!icons) {
        return failure(
          'The icon index is missing. Run `npm run theme:fontawesome` to build it from the Font Awesome Pro bundle.'
        )
      }

      const needle = query.toLowerCase().trim()
      const words = needle.split(/\s+/).filter(Boolean)

      /**
       * Two passes. First require every word to contribute, so "user settings"
       * does not return every icon that merely mentions "user". If that finds
       * nothing — "audit log" has no icon matching "audit" — fall back to
       * scoring on any word, which still ranks by total evidence.
       */
      const collect = (requireAll: boolean) => {
        const found = []
        for (const [name, entry] of Object.entries(icons)) {
          if (style && !entry.s.includes(style)) continue

          const scores = words.map((word) => score(name, entry, word))
          if (requireAll && scores.some((value) => value === 0)) continue

          const total = scores.reduce((sum, value) => sum + value, 0)
          if (total === 0) continue

          found.push({ name, label: entry.l, score: total / words.length, styles: entry.s })
        }
        return found
      }

      let results = collect(true)
      let relaxed = false
      if (results.length === 0 && words.length > 1) {
        results = collect(false)
        relaxed = true
      }

      results.sort((a, b) => b.score - a.score || a.name.length - b.name.length)

      const top = results.slice(0, limit ?? 12).map((hit) => {
        const chosen = style ?? (hit.styles.includes('solid') ? 'solid' : hit.styles[0])
        return {
          class: classFor(hit.name, chosen),
          html: `<i class="${classFor(hit.name, chosen)}"></i>`,
          name: hit.name,
          label: hit.label,
          availableStyles: hit.styles,
        }
      })

      return text({
        query,
        matched: results.length,
        showing: top.length,
        ...(relaxed
          ? { note: 'No icon matched every word, so these match at least one of them.' }
          : {}),
        ...(top.length === 0
          ? {
              note: 'No match. Try a plainer word — the index searches names, labels and synonyms.',
            }
          : {}),
        icons: top,
      })
    }
  )

  server.registerTool(
    'icon_styles',
    {
      title: 'Icon styles available',
      description:
        'Which Font Awesome families/weights are vendored, how to write the classes, and which icon sets exist in this project.',
      inputSchema: {},
    },
    async () => {
      const icons = load()

      return text({
        fontAwesome: {
          version: '7.2.0 Pro',
          total: icons ? Object.keys(icons).length : 'index not built',
          stylesheet: '/theme/fontawesome/css/fontawesome.min.css (already in every layout)',
          shippedStyles: ['solid', 'regular', 'light', 'duotone', 'brands'],
          notShipped: {
            styles: ['thin', 'sharp-*'],
            why: 'They would add ~3MB of webfonts for weights nothing uses.',
            howToAdd:
              'Add the style to STYLES in scripts/vendor-fontawesome.mjs and run `npm run theme:fontawesome`.',
          },
          usage: {
            solid: '<i class="fa-solid fa-user"></i>',
            regular: '<i class="fa-regular fa-user"></i>',
            light: '<i class="fa-light fa-user"></i>',
            duotone: '<i class="fa-duotone fa-user"></i>',
            brands: '<i class="fa-brands fa-github"></i>',
          },
          sizing: 'fa-xs fa-sm fa-lg fa-xl fa-2x … fa-10x, plus fa-fw for fixed width',
          note: 'Use search_icons to get an exact class — an unknown icon renders as blank space, not an error.',
        },
        otherSets: {
          note: 'These ship with the Imtaqin theme and are used by its own markup and by the generated showcase pages. config/menu.ts is Font Awesome only. Prefer Font Awesome for new work; do not rip these out or the vendored showcase pages lose their icons.',
          tabler: 'ti ti-*  — used by the generated showcase pages',
          remix: 'ri ri-*',
          boxicons: 'bx bx-*',
          feather: 'fe fe-*',
          lineAwesome: 'la la-*',
          bootstrap: 'bi bi-*',
        },
      })
    }
  )
}
