import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'

/** Routed as `controllers.role.list.Index`. */
export default class RoleListController {
  async handle({ view }: HttpContext) {
    const roles = await Role.query()
      .preload('permissions')
      .withCount('users')
      .orderBy('is_system', 'desc')
      .orderBy('name')

    return view.render('pages/roles/index', { roles })
  }
}
