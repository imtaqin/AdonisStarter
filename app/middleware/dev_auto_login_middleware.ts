import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import User from '#models/user'
import { SystemRole } from '#models/role'

/**
 * Signs every visitor in as the seeded administrator so the scaffold can be
 * browsed without a login step.
 *
 * This exists for local scaffolding only. It is disabled unless AUTH_BYPASS is
 * explicitly true, and it throws rather than degrades if it ever finds itself
 * running in production -- a silent "everyone is an admin" in a deployed app is
 * the worst possible failure mode.
 *
 * Turn it off by setting AUTH_BYPASS=false in .env; the real login flow at
 * /login is untouched and keeps working either way.
 */
export default class DevAutoLoginMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!env.get('AUTH_BYPASS', false)) {
      return next()
    }

    if (app.inProduction) {
      throw new Error(
        'AUTH_BYPASS is enabled in production. Remove it from the environment before deploying.'
      )
    }

    if (!(await ctx.auth.use('web').check())) {
      const admin = await User.query()
        .whereHas('roles', (query) => query.where('slug', SystemRole.ADMIN))
        .orderBy('id')
        .first()

      if (admin) {
        await ctx.auth.use('web').login(admin)
      }
    }

    return next()
  }
}
