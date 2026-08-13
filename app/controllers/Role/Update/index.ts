import type { HttpContext } from '@adonisjs/core/http'
import Role, { SystemRole } from '#models/role'
import AuditLogger from '#services/audit_logger'
import PermissionCatalog from '#services/permission_catalog'
import { AuditEvent } from '#models/audit_log'
import { updateRoleValidator } from '#validators/role'

/** Routed as `controllers.role.update.Index`. */
export default class RoleUpdateController {
  async show({ params, view }: HttpContext) {
    const role = await Role.query().where('id', params.id).preload('permissions').firstOrFail()

    return view.render('pages/roles/edit', {
      role,
      permissionGroups: await PermissionCatalog.grouped(),
      assignedPermissionIds: role.permissions.map((permission) => permission.id),
    })
  }

  async handle(ctx: HttpContext) {
    const { params, request, response, session } = ctx

    const role = await Role.findOrFail(params.id)
    const before = { name: role.name, slug: role.slug, description: role.description }

    const payload = await updateRoleValidator.validate(request.all(), {
      meta: { roleId: role.id },
    })

    /**
     * System role slugs are referenced by policies and config/menu.ts, so the
     * slug is pinned even though name/description stay editable.
     */
    role.merge({
      name: payload.name,
      slug: role.isSystem ? role.slug : payload.slug,
      description: payload.description,
    })
    await role.save()

    /**
     * The admin role bypasses permission checks anyway; letting someone edit
     * its permission set implies a restriction that is not real, so it is
     * left alone.
     */
    if (role.slug !== SystemRole.ADMIN) {
      await role.related('permissions').sync(payload.permissionIds ?? [])
    }

    const after = { name: role.name, slug: role.slug, description: role.description }
    const { oldValues, newValues } = AuditLogger.diff(before, after)

    await AuditLogger.log(ctx, {
      event: AuditEvent.UPDATED,
      subject: role,
      summary: `Updated role ${role.name}`,
      oldValues,
      newValues,
    })

    session.flash('success', `Role ${role.name} was updated`)
    return response.redirect().toRoute('roles.index')
  }
}
