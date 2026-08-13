import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Marks a response as non-cacheable.
 *
 * Without this, a shared browser or an intermediary proxy can serve a
 * previously rendered authenticated page to the next person -- including after
 * logout, via the back button. Apply to every route that renders data belonging
 * to the signed-in user (OWASP A01 / A05).
 *
 * Set before `next()` so the headers are already staged when the response is
 * written; setting them afterwards throws on streamed responses.
 */
export default class NoCacheMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    response.header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.header('Pragma', 'no-cache')
    response.header('Expires', '0')

    return next()
  }
}
