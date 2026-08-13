import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import MenuService from '#services/menu_service'
import PermissionsService, { UserAbilities } from '#services/permissions_service'

/**
 * Resolves the current user's abilities once per request and shares the data
 * every dashboard view needs: `menu`, `abilities`, `can()` and `currentPath`.
 *
 * Runs after `silent_auth_middleware`, so `auth.user` is already populated for
 * signed-in visitors without requiring authentication.
 */
export default class ShareViewDataMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    const abilities = user ? await PermissionsService.forUser(user) : UserAbilities.guest()

    ctx.abilities = abilities

    /**
     * Only pay for menu construction when something is going to render it.
     */
    if (ctx.view) {
      const currentPath = ctx.request.url()

      ctx.view.share({
        abilities,
        can: (permission: string) => abilities.can(permission),
        menu: MenuService.build(currentPath, abilities),
        currentPath,
      })
    }

    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    abilities: UserAbilities
  }
}
