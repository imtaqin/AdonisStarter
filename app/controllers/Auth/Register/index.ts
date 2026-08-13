import type { HttpContext } from '@adonisjs/core/http'
import Role, { SystemRole } from '#models/role'
import User from '#models/user'
import AuditLogger from '#services/audit_logger'
import { AuditEvent } from '#models/audit_log'
import { signupValidator } from '#validators/user'

/** Routed as `controllers.auth.register.Index`. */
export default class RegisterController {
  async show({ view }: HttpContext) {
    return view.render('pages/auth/signup')
  }

  async handle(ctx: HttpContext) {
    const { request, response, session, auth } = ctx

    /**
     * Only the three fields below are read from the payload. Never spread the
     * request body into `User.create` -- that is how `isActive` or a role id
     * gets set by a crafted form (OWASP A08, mass assignment).
     */
    const payload = await signupValidator.validate(request.all())

    const user = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      isActive: true,
    })

    /**
     * Self-registered accounts always get the least-privileged role. Elevation
     * happens through the Users screen, which is permission gated.
     */
    const memberRole = await Role.findBy('slug', SystemRole.MEMBER)
    if (memberRole) {
      await user.related('roles').attach([memberRole.id])
    }

    await auth.use('web').login(user)
    await session.regenerate()

    await AuditLogger.log(ctx, {
      event: AuditEvent.CREATED,
      subject: user,
      summary: `${user.email} registered`,
      newValues: { email: user.email, fullName: user.fullName },
    })

    return response.redirect().toRoute('dashboard')
  }
}
