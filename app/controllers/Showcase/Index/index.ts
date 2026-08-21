import type { HttpContext } from '@adonisjs/core/http'
import { showcasePageSet } from '#config/showcase'

/**
 * Routed as `controllers.showcase.index.Index`.
 *
 * Serves the converted Imtaqin template pages as browsable reference markup. The
 * `:page` parameter is checked against a generated allowlist before it reaches
 * `view.render`, so it cannot be used to render arbitrary templates or traverse
 * the filesystem (OWASP A01/A03).
 */
export default class ShowcaseController {
  async handle({ params, view, response }: HttpContext) {
    const page = String(params.page ?? '')

    if (!showcasePageSet.has(page)) {
      response.status(404)
      return view.render('pages/errors/not_found')
    }

    return view.render(`pages/showcase/${page}`)
  }
}
