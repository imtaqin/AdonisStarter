import type { HttpContext } from '@adonisjs/core/http'
import { DEFAULT_THEME, resolveTheme, themesByFamily } from '#config/themes'
import { updateThemeValidator } from '#validators/theme'

/** Routed as `controllers.theme.index.Index`. */
export default class ThemeIndexController {
  async show({ view, auth }: HttpContext) {
    return view.render('pages/themes/index', {
      families: themesByFamily(),
      active: resolveTheme(auth.user?.theme),
      defaultTheme: DEFAULT_THEME,
    })
  }

  async handle({ request, response, session, auth }: HttpContext) {
    /**
     * `auth.user` is guaranteed by middleware.auth() on the route; the throw is
     * a guard against this handler being reused on an unprotected route later.
     */
    const user = auth.user
    if (!user) {
      return response.redirect().toRoute('auth.login.show')
    }

    const { theme } = await request.validateUsing(updateThemeValidator)

    /**
     * A theme is a personal display preference, so it is not written to the
     * audit log: every switch would add a row that tells an investigator
     * nothing, and burying real events is how an audit trail stops being read.
     */
    user.theme = theme
    await user.save()

    session.flash('success', `Theme switched to ${resolveTheme(theme).label}`)
    return response.redirect().toRoute('themes.show')
  }
}
