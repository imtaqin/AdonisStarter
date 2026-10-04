import type { HttpContext } from '@adonisjs/core/http'
import {
  DEFAULT_THEME,
  LAYOUT_SETTINGS,
  LAYOUT_SETTING_KEYS,
  resolveLayoutOptions,
  resolveTheme,
  themesByFamily,
} from '#config/themes'
import { updateLayoutValidator, updateThemeValidator } from '#validators/theme'

/** Routed as `controllers.theme.index.Index`. */
export default class ThemeIndexController {
  async show({ view, auth }: HttpContext) {
    return view.render('pages/themes/index', {
      families: themesByFamily(),
      active: resolveTheme(auth.user?.theme),
      defaultTheme: DEFAULT_THEME,
      layoutSettings: LAYOUT_SETTING_KEYS.map((key) => ({ key, ...LAYOUT_SETTINGS[key] })),
      layout: resolveLayoutOptions(auth.user?.themeOptions),
    })
  }

  async handle({ request, response, session, auth }: HttpContext) {
    /**
     * `auth.user` is guaranteed by middleware.auth() on the route; the guard is
     * here in case this handler is ever reused on an unprotected one.
     */
    const user = auth.user
    if (!user) {
      return response.redirect().toRoute('auth.login.show')
    }

    /**
     * One endpoint, two forms. The theme cards post `theme`; the layout form
     * posts the data-* options. Distinguishing on the field present keeps both
     * on a single POST route, which matters because this app uses GET and POST
     * only -- there is no PATCH to separate them with.
     */
    if (request.input('theme') !== undefined) {
      const { theme } = await request.validateUsing(updateThemeValidator)

      /**
       * A display preference is deliberately not audit-logged: a row per theme
       * switch tells an investigator nothing and buries the events that matter.
       */
      user.theme = theme
      await user.save()

      session.flash('success', `Theme switched to ${resolveTheme(theme).label}`)
      return response.redirect().toRoute('themes.show')
    }

    const payload = await request.validateUsing(updateLayoutValidator)

    /* Merge over the current options so a partial form cannot blank the rest. */
    const merged = { ...resolveLayoutOptions(user.themeOptions), ...payload }
    user.themeOptions = JSON.stringify(resolveLayoutOptions(merged))
    await user.save()

    session.flash('success', 'Layout updated')
    return response.redirect().toRoute('themes.show')
  }
}
