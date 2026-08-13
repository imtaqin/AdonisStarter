/*
|--------------------------------------------------------------------------
| Edge globals
|--------------------------------------------------------------------------
|
| Values available in every template without being passed through
| `view.render()`. Request-scoped data (menu, abilities, can) is shared by
| ShareViewDataMiddleware instead -- globals must not depend on the request.
|
*/

import edge from 'edge.js'
import dashboardConfig from '#config/dashboard'

edge.global('appName', dashboardConfig.appName)
edge.global('brandLogos', dashboardConfig.logos)

/**
 * Formats a Luxon DateTime (or null) for display in tables and detail screens.
 */
edge.global(
  'formatDate',
  (value: { toFormat?: (f: string) => string } | null, format = 'dd LLL yyyy, HH:mm') => {
    if (!value || typeof value.toFormat !== 'function') return '—'
    return value.toFormat(format)
  }
)

/**
 * Bootstrap contextual class for a boolean state, e.g. active/inactive badges.
 */
edge.global('boolVariant', (value: boolean) => (value ? 'success' : 'secondary'))

/**
 * Serialises a value for embedding in an inline <script>.
 *
 * Must be printed with triple braces. Escaping `<` is what makes that safe: it
 * prevents a string in the data from closing the script element and injecting
 * markup (OWASP A03). The line separators are escaped because they are literal
 * newlines in JavaScript but legal inside a JSON string.
 *
 *   <script>const rows = {{{ toJson(rows) }}}</script>
 */
edge.global('toJson', (value: unknown) =>
  JSON.stringify(value ?? null)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
)
