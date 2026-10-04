import type { HttpContext } from '@adonisjs/core/http'
import { velzonPageSet } from '#config/velzon_showcase'

/**
 * Routed as `controllers.velzon.show.Index`.
 *
 * Serves the converted Velzon template pages as browsable reference markup. The
 * `:page` parameter is checked against a generated allowlist before it reaches
 * `view.render`, so it cannot select an arbitrary template or traverse the
 * filesystem (OWASP A01/A03).
 */
export default class VelzonShowController {
  async handle({ params, view, response }: HttpContext) {
    const page = String(params.page ?? '')

    if (!velzonPageSet.has(page)) {
      response.status(404)
      return view.render('pages/errors/not_found')
    }

    return view.render(`pages/velzon/${page}`)
  }
}
