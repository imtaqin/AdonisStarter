import type { HttpContext } from '@adonisjs/core/http'
import IconCatalog, { ICON_STYLES } from '#services/icon_catalog'

/**
 * Routed as `controllers.icon.list.Index`.
 *
 * Browsable Font Awesome Pro catalogue — the human counterpart to the
 * `search_icons` MCP tool.
 */
export default class IconListController {
  /** Icons per page. Enough to scan, few enough to keep the DOM light. */
  static readonly PER_PAGE = 120

  async handle({ request, view }: HttpContext) {
    const search = String(request.input('search', '')).trim().slice(0, 60)
    const styleInput = String(request.input('style', '')).trim()

    // Allowlist the style so it can never reach the class string unchecked.
    const style = (ICON_STYLES as readonly string[]).includes(styleInput) ? styleInput : ''

    const page = Math.max(1, Number(request.input('page', 1)) || 1)

    const matches = IconCatalog.search(search, style || undefined)
    const total = matches.length
    const lastPage = Math.max(1, Math.ceil(total / IconListController.PER_PAGE))
    const current = Math.min(page, lastPage)
    const offset = (current - 1) * IconListController.PER_PAGE

    const icons = matches.slice(offset, offset + IconListController.PER_PAGE).map((icon) => ({
      name: icon.name,
      label: icon.label,
      styles: icon.styles,
      class: IconCatalog.classFor(icon, style || undefined),
    }))

    /** Preserve the filters when building page links. */
    const query = new URLSearchParams()
    if (search) query.set('search', search)
    if (style) query.set('style', style)
    const baseQuery = query.toString()

    return view.render('pages/icons/index', {
      available: IconCatalog.isAvailable,
      icons,
      styles: ICON_STYLES,
      filters: { search, style },
      pagination: {
        total,
        current,
        lastPage,
        from: total === 0 ? 0 : offset + 1,
        to: Math.min(offset + IconListController.PER_PAGE, total),
        urlFor: (target: number) => `/icons?${baseQuery ? `${baseQuery}&` : ''}page=${target}`,
      },
    })
  }
}
