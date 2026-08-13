import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import User from '#models/user'
import AuditLogger from '#services/audit_logger'
import { AuditEvent } from '#models/audit_log'
import { updateUserValidator } from '#validators/user'

/** Routed as `controllers.user.update.Index`. */
export default class UserUpdateController {
  async show({ params, view }: HttpContext) {
    const user = await User.query().where('id', params.id).preload('roles').firstOrFail()

    return view.render('pages/users/edit', {
      user,
      roles: await Role.query().orderBy('name'),
      assignedRoleIds: user.roles.map((role) => role.id),
    })
  }

  async handle(ctx: HttpContext) {
    const { params, request, response, session, auth } = ctx

    const user = await User.findOrFail(params.id)
    const before = { fullName: user.fullName, email: user.email, isActive: user.isActive }

    const payload = await updateUserValidator.validate(request.all(), {
      meta: { userId: user.id },
    })

    user.merge({
      fullName: payload.fullName,
      email: payload.email,
      isActive: payload.isActive ?? false,
    })

    // An empty password field means "keep the existing password".
    if (payload.password) {
      user.password = payload.password
    }

    /**
     * Editing yourself must not let you drop your own roles -- that is a
     * one-click privilege lockout, and for an admin it can leave the install
     * with nobody able to manage users.
     */
    const isSelf = auth.user?.id === user.id
    if (!isSelf) {
      await user.related('roles').sync(payload.roleIds ?? [])
    }

    await user.save()

    const after = { fullName: user.fullName, email: user.email, isActive: user.isActive }
    const { oldValues, newValues } = AuditLogger.diff(before, after)

    await AuditLogger.log(ctx, {
      event: AuditEvent.UPDATED,
      subject: user,
      summary: `Updated user ${user.email}`,
      oldValues,
      newValues,
    })

    session.flash(
      'success',
      isSelf ? 'Your profile was updated (roles unchanged)' : `User ${user.email} was updated`
    )
    return response.redirect().toRoute('users.index')
  }
}
