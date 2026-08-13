import type { HttpContext } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'
import { DateTime } from 'luxon'
import User from '#models/user'
import AuditLogger from '#services/audit_logger'
import { AuditEvent } from '#models/audit_log'
import { loginValidator } from '#validators/auth'

/**
 * Routed as `controllers.auth.login.Index`.
 *
 * `show` renders the form, `handle` authenticates. Rate limiting lives on the
 * route (see start/limiter.ts), not here.
 */
export default class LoginController {
  async show({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  async handle(ctx: HttpContext) {
    const { request, response, session, auth } = ctx
    const { email, password, rememberMe } = await loginValidator.validate(request.all())

    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      /**
       * Record the attempt, but never reveal whether the address exists --
       * doing so turns the login form into an account enumeration oracle.
       */
      if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
        await AuditLogger.log(ctx, {
          event: AuditEvent.LOGIN_FAILED,
          summary: `Failed login for ${email}`,
        })

        session.flashAll()
        session.flash('error', 'Invalid email or password')
        return response.redirect().back()
      }
      throw error
    }

    /**
     * A deactivated account must not be able to trade valid credentials for a
     * session, so this check happens before login rather than in middleware.
     */
    if (!user.isActive) {
      await AuditLogger.log(ctx, {
        event: AuditEvent.LOGIN_FAILED,
        subject: user,
        summary: `Blocked login for deactivated account ${user.email}`,
      })

      session.flash('error', 'Invalid email or password')
      return response.redirect().back()
    }

    await auth.use('web').login(user, rememberMe ?? false)

    /**
     * Rotate the session id on privilege change to defeat session fixation
     * (OWASP A07).
     */
    await session.regenerate()

    user.lastLoginAt = DateTime.now()
    await user.save()

    await AuditLogger.log(ctx, {
      event: AuditEvent.LOGIN,
      subject: user,
      summary: `${user.email} signed in`,
    })

    return response.redirect().toRoute('dashboard')
  }
}
