/*
|--------------------------------------------------------------------------
| HTTP kernel file
|--------------------------------------------------------------------------
|
| The HTTP kernel file is used to register the middleware with the server
| or the router.
|
*/

import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

/**
 * The error handler is used to convert an exception
 * to an HTTP response.
 */
server.errorHandler(() => import('#exceptions/handler'))

/**
 * The server middleware stack runs middleware on all the HTTP
 * requests, even if there is no route registered for
 * the request URL.
 */
server.use([
  () => import('#middleware/container_bindings_middleware'),
  /**
   * Runs on every response, including static files and 404s, so the headers
   * are never missing on the paths that skip the router stack.
   */
  () => import('#middleware/security_headers_middleware'),
  () => import('@adonisjs/static/static_middleware'),
  () => import('@adonisjs/vite/vite_middleware'),
])

/**
 * The router middleware stack runs middleware on all the HTTP
 * requests with a registered route.
 */
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/session/session_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
  /**
   * Local-only: signs the visitor in automatically when AUTH_BYPASS=true.
   * Must run before silent_auth so the guard sees the session it creates.
   */
  () => import('#middleware/dev_auto_login_middleware'),
  () => import('#middleware/silent_auth_middleware'),
  () => import('#middleware/initialize_bouncer_middleware'),
  () => import('#middleware/share_view_data_middleware'),
])

/**
 * Named middleware collection must be explicitly assigned to
 * the routes or the routes group.
 */
export const middleware = router.named({
  guest: () => import('#middleware/guest_middleware'),
  auth: () => import('#middleware/auth_middleware'),
  /** Gates a route on a permission slug -- see app/middleware/permission_middleware.ts */
  permission: () => import('#middleware/permission_middleware'),
  /** Marks a response non-cacheable; use on anything showing user data */
  noCache: () => import('#middleware/no_cache_middleware'),
})
