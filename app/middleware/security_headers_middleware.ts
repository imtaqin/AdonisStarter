import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Response headers that @adonisjs/shield does not set.
 *
 * Shield already handles CSP, HSTS, X-Frame-Options and X-Content-Type-Options
 * from config/shield.ts; this covers the rest (OWASP A05, security
 * misconfiguration).
 *
 * Headers are set BEFORE `next()`. Setting them afterwards throws
 * ERR_HTTP_HEADERS_SENT for anything that streams its response -- static files
 * being the common case, since this middleware runs in the server stack.
 */
export default class SecurityHeadersMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    /** Do not leak the path a user came from to third-party sites. */
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    /** Switch off browser features this application never uses. */
    response.header(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    )

    /** Block Flash/PDF cross-domain policy files. */
    response.header('X-Permitted-Cross-Domain-Policies', 'none')

    /** Isolate this origin from cross-origin popups and embeds. */
    response.header('Cross-Origin-Opener-Policy', 'same-origin')
    response.header('Cross-Origin-Resource-Policy', 'same-origin')

    return next()
  }
}
