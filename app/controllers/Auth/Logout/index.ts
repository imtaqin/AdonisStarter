import type { HttpContext } from '@adonisjs/core/http'
import AuditLogger from '#services/audit_logger'
import { AuditEvent } from '#models/audit_log'

/** Routed as `controllers.auth.logout.Index`. */
export default class LogoutController {
  async handle(ctx: HttpContext) {
    const { auth, response, session } = ctx
    const user = auth.user

    if (user) {
      await AuditLogger.log(ctx, {
        event: AuditEvent.LOGOUT,
        subject: user,
        summary: `${user.email} signed out`,
      })
    }

    await auth.use('web').logout()

    /**
     * Drop the whole session rather than just the auth guard, so nothing
     * belonging to the previous user survives into the next one.
     */
    await session.regenerate()

    return response.redirect().toRoute('auth.login.show')
  }
}
