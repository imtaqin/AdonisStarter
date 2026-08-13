import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import User from '#models/user'
import AuditLogger from '#services/audit_logger'
import { AuditEvent } from '#models/audit_log'
import { createUserValidator } from '#validators/user'

/** Routed as `controllers.user.create.Index`. */
export default class UserCreateController {
  async show({ view }: HttpContext) {
    return view.render('pages/users/create', {
      roles: await Role.query().orderBy('name'),
    })
  }

  async handle(ctx: HttpContext) {
    const { request, response, session } = ctx
    const payload = await createUserValidator.validate(request.all())

    // Explicit field list: never spread the request body into create().
    const user = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      isActive: payload.isActive ?? true,
    })

    await user.related('roles').sync(payload.roleIds ?? [])

    await AuditLogger.log(ctx, {
      event: AuditEvent.CREATED,
      subject: user,
      summary: `Created user ${user.email}`,
      newValues: { fullName: user.fullName, email: user.email, isActive: user.isActive },
    })

    session.flash('success', `User ${user.email} was created`)
    return response.redirect().toRoute('users.index')
  }
}
