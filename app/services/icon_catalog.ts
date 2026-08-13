import fs from 'node:fs'
import app from '@adonisjs/core/services/app'

/**
 * Font Awesome Pro catalogue, shared by the /icons browser page and available
 * to anything else that needs to resolve an icon.
 *
 * Backed by the compact index that `scripts/vendor-fontawesome.mjs` builds from
 * Font Awesome's 36MB metadata file. It is read once and cached for the life of
 * the process -- 0.8MB of JSON is cheap to hold and expensive to re-parse per
 * request.
 */

type RawEntry = { l: string; s: string[]; t: string[] }

export type Icon = {
  name: string
  label: string
  styles: string[]
  terms: string[]
}

export const ICON_STYLES = ['solid', 'regular', 'light', 'duotone', 'brands'] as const
export type IconStyle = (typeof ICON_STYLES)[number]

let cache: Icon[] | null = null

export default class IconCatalog {
  static get indexPath() {
    return app.makePath('mcp/boost/data/fontawesome-index.json')
  }

  /** True when the index has been generated. */
  static get isAvailable() {
    return fs.existsSync(IconCatalog.indexPath)
  }

  static all(): Icon[] {
    if (cache) return cache
    if (!IconCatalog.isAvailable) return []

    const raw = JSON.parse(fs.readFileSync(IconCatalog.indexPath, 'utf8')) as Record<
      string,
      RawEntry
    >

    cache = Object.entries(raw).map(([name, entry]) => ({
      name,
      label: entry.l,
      styles: entry.s,
      terms: entry.t,
    }))

    return cache
  }

  /**
   * Filters by free text and style. Matching covers the name, the human label
   * and Font Awesome's own synonym list, so "delete" finds `trash` even though
   * the word never appears in its name.
   */
  static search(query: string, style?: string): Icon[] {
    const needle = query.trim().toLowerCase()

    return IconCatalog.all().filter((icon) => {
      if (style && !icon.styles.includes(style)) return false
      if (!needle) return true

      return (
        icon.name.includes(needle) ||
        icon.label.toLowerCase().includes(needle) ||
        icon.terms.some((term) => term.includes(needle))
      )
    })
  }

  /** The class string to render an icon, e.g. `fa-solid fa-user`. */
  static classFor(icon: Icon, style?: string) {
    const chosen = style && icon.styles.includes(style) ? style : (icon.styles[0] ?? 'solid')
    return `fa-${chosen} fa-${icon.name}`
  }
}
