import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/shield'

/**
 * Browser-facing protections (OWASP A03 injection/XSS, A01 clickjacking,
 * A05 misconfiguration). Headers Shield does not cover live in
 * app/middleware/security_headers_middleware.ts.
 */

/**
 * The Imtaqin stylesheet `@import`s Roboto and Montserrat from Google Fonts, so
 * the CSS host and the font host both have to be allowed. Remove these two
 * entries if you self-host the fonts instead -- strip the @import from
 * public/theme/css/styles.min.css and drop the files into public/theme.
 */
const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com'
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com'

/**
 * Vite's dev server pushes hot updates over a websocket. It only exists while
 * `node ace serve` is running, so the allowance is scoped to non-production.
 */
const devConnectSources = app.inProduction ? [] : ['ws://localhost:*', 'http://localhost:*']

const shieldConfig = defineConfig({
  /**
   * Content Security Policy.
   *
   * KNOWN WEAKNESS: `unsafe-inline` is required by the bundled Imtaqin theme,
   * which ships inline <script> blocks and inline `onclick=` handlers on its
   * demo pages. It materially weakens XSS protection.
   *
   * To remove it: delete resources/views/pages/showcase, move any remaining
   * inline script into resources/js/, then switch to `@nonce`.
   *
   * Everything else is locked down, so even with inline script permitted an
   * injected payload cannot load external code, embed plugins, rewrite the
   * document base, or repoint a form at an attacker's server.
   */
  csp: {
    enabled: true,
    directives: {
      defaultSrc: [`'self'`],
      scriptSrc: [`'self'`, `'unsafe-inline'`],
      styleSrc: [`'self'`, `'unsafe-inline'`, GOOGLE_FONTS_CSS],
      imgSrc: [`'self'`, 'data:', 'blob:'],
      fontSrc: [`'self'`, 'data:', GOOGLE_FONTS_FILES],
      connectSrc: [`'self'`, ...devConnectSources],
      mediaSrc: [`'self'`],
      objectSrc: [`'none'`],
      baseUri: [`'self'`],
      formAction: [`'self'`],
      frameAncestors: [`'none'`],
      ...(app.inProduction ? { upgradeInsecureRequests: [] } : {}),
    },
    reportOnly: false,
  },

  /**
   * CSRF protection on every state-changing request. This app uses GET and POST
   * only, so POST is what matters -- the other verbs stay listed in case a
   * future route needs them.
   */
  csrf: {
    enabled: true,
    exceptRoutes: [],
    enableXsrfCookie: false,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  xFrame: {
    enabled: true,
    action: 'DENY',
  },

  hsts: {
    enabled: true,
    maxAge: '180 days',
    includeSubDomains: true,
  },

  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
