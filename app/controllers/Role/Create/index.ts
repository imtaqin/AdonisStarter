import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import AuditLogger from '#services/audit_logger'
import PermissionCatalog from '#services/permission_catalog'
import { AuditEvent } from '#models/audit_log'
import { createRoleValidator } from '#validators/role'

/** Routed as `controllers.role.create.Index`. */
export default class RoleCreateController {
  async show({ view }: HttpContext) {
    return view.render('pages/roles/create', {
      permissionGroups: await PermissionCatalog.grouped(),
      assignedPermissionIds: [],
    })
  }

  async handle(ctx: HttpContext) {
    const { request, response, session } = ctx
    const payload = await createRoleValidator.validate(request.all())

    /**
     * `isSystem` is set here, never taken from the payload: a crafted form must
     * not be able to mint an undeletable role (OWASP A08).
     */
    const role = await Role.create({
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      isSystem: false,
    })

    await role.related('permissions').sync(payload.permissionIds ?? [])

    await AuditLogger.log(ctx, {
      event: AuditEvent.CREATED,
      subject: role,
      summary: `Created role ${role.name}`,
      newValues: { name: role.name, slug: role.slug },
    })

    session.flash('success', `Role ${role.name} was created`)
    return response.redirect().toRoute('roles.index')
  }
}
