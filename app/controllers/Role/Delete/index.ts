import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import AuditLogger from '#services/audit_logger'
import { AuditEvent } from '#models/audit_log'

/** Routed as `controllers.role.delete.Index`. */
export default class RoleDeleteController {
  async handle(ctx: HttpContext) {
    const { params, response, session } = ctx
    const role = await Role.query().where('id', params.id).withCount('users').firstOrFail()

    if (role.isSystem) {
      session.flash('error', `${role.name} is a system role and cannot be deleted`)
      return response.redirect().toRoute('roles.index')
    }

    /**
     * Deleting a role cascades the pivot rows, silently stripping permissions
     * from everyone holding it. Make that an explicit decision instead.
     */
    const assigned = Number(role.$extras.users_count ?? 0)
    if (assigned > 0) {
      session.flash(
        'error',
        `${role.name} is still assigned to ${assigned} user(s). Reassign them first.`
      )
      return response.redirect().toRoute('roles.index')
    }

    const snapshot = { name: role.name, slug: role.slug }
    const deletedId = role.id
    await role.delete()

    await AuditLogger.log(ctx, {
      event: AuditEvent.DELETED,
      subjectType: 'Role',
      subjectId: deletedId,
      summary: `Deleted role ${snapshot.name}`,
      oldValues: snapshot,
    })

    session.flash('success', `Role ${snapshot.name} was deleted`)
    return response.redirect().toRoute('roles.index')
  }
}
