import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * Gates a route on a permission slug.
 *
 *   router.get('users', [...]).use(middleware.permission({ permission: 'users.view' }))
 *
 * Relies on `ctx.abilities`, which ShareViewDataMiddleware resolves earlier in
 * the stack. Use this for whole screens; use Bouncer policies when the decision
 * depends on the specific record.
 */
export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { permission: string }) {
    if (!ctx.abilities?.can(options.permission)) {
      throw new Exception('You are not authorized to perform this action', {
        status: 403,
        code: 'E_AUTHORIZATION_FAILURE',
      })
    }

    return next()
  }
}
