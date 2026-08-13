import type { HttpContext } from '@adonisjs/core/http'
import dashboardConfig from '#config/dashboard'
import Role from '#models/role'
import User from '#models/user'

/** Routed as `controllers.user.list.Index`. */
export default class UserListController {
  async handle({ request, view }: HttpContext) {
    const page = Number(request.input('page', 1)) || 1
    const search = String(request.input('search', '')).trim().slice(0, 100)
    const roleFilter = String(request.input('role', '')).trim().slice(0, 80)

    const users = await User.query()
      .preload('roles')
      /**
       * Bound parameters throughout -- `search` is never interpolated into SQL
       * (OWASP A03).
       */
      .if(search, (query) => {
        query.where((builder) => {
          builder.whereILike('full_name', `%${search}%`).orWhereILike('email', `%${search}%`)
        })
      })
      .if(roleFilter, (query) => {
        query.whereHas('roles', (builder) => builder.where('slug', roleFilter))
      })
      .orderBy('created_at', 'desc')
      .paginate(page, dashboardConfig.perPage)

    users.baseUrl(request.url())
    users.queryString(request.qs())

    return view.render('pages/users/index', {
      users,
      roles: await Role.query().orderBy('name'),
      filters: { search, role: roleFilter },
    })
  }
}
