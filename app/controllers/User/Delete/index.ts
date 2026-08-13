import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import AuditLogger from '#services/audit_logger'
import { AuditEvent } from '#models/audit_log'

/** Routed as `controllers.user.delete.Index`. */
export default class UserDeleteController {
  async handle(ctx: HttpContext) {
    const { params, auth, response, session } = ctx

    const user = await User.findOrFail(params.id)

    // Deleting yourself would log you out of the screen you are standing on.
    if (auth.user?.id === user.id) {
      session.flash('error', 'You cannot delete your own account')
      return response.redirect().toRoute('users.index')
    }

    const snapshot = { fullName: user.fullName, email: user.email, isActive: user.isActive }
    const deletedId = user.id
    await user.delete()

    await AuditLogger.log(ctx, {
      event: AuditEvent.DELETED,
      subjectType: 'User',
      subjectId: deletedId,
      summary: `Deleted user ${snapshot.email}`,
      oldValues: snapshot,
    })

    session.flash('success', `User ${snapshot.email} was deleted`)
    return response.redirect().toRoute('users.index')
  }
}
