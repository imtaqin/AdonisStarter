import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import MenuService from '#services/menu_service'
import { layoutAttributes, resolveLayoutOptions, resolveTheme } from '#config/themes'
import PermissionsService, { UserAbilities } from '#services/permissions_service'

/**
 * Resolves the current user's abilities once per request and shares the data
 * every dashboard view needs: `menu`, `abilities`, `can()`, `currentPath` and
 * the active `theme`.
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
        /**
         * `resolveTheme` validates against the config/themes.ts allowlist and
         * falls back to the default, so a stale or tampered column cannot put
         * an arbitrary path into the layout's asset URLs.
         */
        theme: resolveTheme(user?.theme),
        /**
         * Velzon drives its layout from data-* attributes on <html>. Both the
         * resolved map (for the picker) and the rendered attribute string (for
         * the shell) are shared, so no template has to build the string itself.
         */
        layoutOptions: resolveLayoutOptions(user?.themeOptions),
        layoutAttrs: layoutAttributes(resolveLayoutOptions(user?.themeOptions)),
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
