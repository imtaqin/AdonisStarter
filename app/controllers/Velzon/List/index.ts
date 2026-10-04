import type { HttpContext } from '@adonisjs/core/http'
import { VELZON_PAGES, VELZON_PAGE_TITLES } from '#config/velzon_showcase'

/**
 * Routed as `controllers.velzon.list.Index`.
 *
 * Index of the Velzon catalogue. Groups by the slug prefix the template uses
 * (`apps-`, `ui-`, `charts-`...) so 167 pages arrive as a dozen sections rather
 * than one wall of links.
 */
export default class VelzonListController {
  async handle({ view, request }: HttpContext) {
    const search = String(request.input('search', '')).trim().toLowerCase()

    const matching = VELZON_PAGES.filter((slug) => {
      if (!search) return true
      const title = VELZON_PAGE_TITLES[slug] ?? ''
      return slug.includes(search) || title.toLowerCase().includes(search)
    })

    const groups = new Map<string, { slug: string; title: string }[]>()
    for (const slug of matching) {
      /* `apps-crm-deals` groups under `apps`; a slug with no dash under `misc`. */
      const group = slug.includes('-') ? slug.slice(0, slug.indexOf('-')) : 'misc'
      const bucket = groups.get(group) ?? []
      bucket.push({ slug, title: VELZON_PAGE_TITLES[slug] ?? slug })
      groups.set(group, bucket)
    }

    return view.render('pages/velzon_index', {
      groups: [...groups]
        .map(([name, pages]) => ({ name, pages }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      total: VELZON_PAGES.length,
      matched: matching.length,
      filters: { search },
    })
  }
}
