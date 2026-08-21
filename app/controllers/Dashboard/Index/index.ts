import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import AuditLog from '#models/audit_log'
import Role from '#models/role'
import User from '#models/user'

/**
 * Routed as `controllers.dashboard.index.Index`.
 *
 * Every number on this screen comes from a real query -- there is no
 * placeholder data to strip out when you build on it.
 */
export default class DashboardController {
  async handle({ view }: HttpContext) {
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 })

    const [totalUsers, activeUsers, newUsers, totalRoles, eventsToday] = await Promise.all([
      User.query().count('* as total'),
      User.query().where('is_active', true).count('* as total'),
      User.query().where('created_at', '>=', thirtyDaysAgo.toSQL()!).count('* as total'),
      Role.query().count('* as total'),
      AuditLog.query()
        .where('created_at', '>=', DateTime.now().startOf('day').toSQL()!)
        .count('* as total'),
    ])

    const count = (rows: { $extras: Record<string, unknown> }[]) =>
      Number(rows[0]?.$extras.total ?? 0)

    /**
     * Signups per day for the last 14 days, zero-filled so the chart has a
     * point for every day rather than silently collapsing gaps.
     */
    const signupRows = await db
      .from('users')
      .where('created_at', '>=', DateTime.now().minus({ days: 13 }).startOf('day').toSQL()!)
      .select(db.raw('date(created_at) as day'), db.raw('count(*) as total'))
      .groupByRaw('date(created_at)')

    const byDay = new Map(signupRows.map((row) => [row.day, Number(row.total)]))
    const signupTrend = Array.from({ length: 14 }, (_, index) => {
      const day = DateTime.now().minus({ days: 13 - index })
      return {
        label: day.toFormat('dd LLL'),
        total: byDay.get(day.toFormat('yyyy-MM-dd')) ?? 0,
      }
    })

    const usersByRole = await db
      .from('roles')
      .leftJoin('role_user', 'role_user.role_id', 'roles.id')
      .groupBy('roles.id', 'roles.name')
      .select('roles.name')
      .count('role_user.user_id as total')

    const recentActivity = await AuditLog.query()
      .preload('user')
      .orderBy('created_at', 'desc')
      .limit(8)

    const recentUsers = await User.query().preload('roles').orderBy('created_at', 'desc').limit(5)

    return view.render('pages/dashboard', {
      stats: {
        totalUsers: count(totalUsers),
        activeUsers: count(activeUsers),
        newUsers: count(newUsers),
        totalRoles: count(totalRoles),
        eventsToday: count(eventsToday),
      },
      signupTrend,
      usersByRole: usersByRole.map((row) => ({ name: row.name, total: Number(row.total) })),
      recentActivity,
      recentUsers,
    })
  }
}
