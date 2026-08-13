import type { HttpContext } from '@adonisjs/core/http'
import dashboardConfig from '#config/dashboard'
import AuditLog from '#models/audit_log'
import User from '#models/user'

/** Routed as `controllers.auditlog.list.Index`. */
export default class AuditLogListController {
  async handle({ request, view }: HttpContext) {
    const page = Number(request.input('page', 1)) || 1
    const event = String(request.input('event', '')).trim().slice(0, 40)
    const userId = Number(request.input('user', 0)) || 0

    const logs = await AuditLog.query()
      .preload('user')
      .if(event, (query) => query.where('event', event))
      .if(userId, (query) => query.where('user_id', userId))
      .orderBy('created_at', 'desc')
      .paginate(page, dashboardConfig.perPage)

    logs.baseUrl(request.url())
    logs.queryString(request.qs())

    /**
     * Only events actually present in the table, so the filter never offers a
     * value that returns nothing.
     */
    const events = await AuditLog.query().distinct('event').orderBy('event')

    return view.render('pages/audit_logs/index', {
      logs,
      events: events.map((row) => row.event),
      actors: await User.query().orderBy('email'),
      filters: { event, user: userId ? String(userId) : '' },
    })
  }
}
