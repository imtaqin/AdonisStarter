import db from '@adonisjs/lucid/services/db'
import { SystemRole } from '#models/role'
import type User from '#models/user'

/**
 * The set of capabilities a user holds, resolved once per request.
 *
 * `can()` is synchronous so templates and policies can call it freely; the one
 * database round-trip happens up front in `forUser()`.
 */
export class UserAbilities {
  constructor(
    readonly isAdmin: boolean,
    readonly permissions: Set<string>,
    readonly roles: Set<string>
  ) {}

  /** Admins implicitly hold every permission, including ones added later. */
  can(permission: string): boolean {
    return this.isAdmin || this.permissions.has(permission)
  }

  cannot(permission: string): boolean {
    return !this.can(permission)
  }

  hasRole(slug: string): boolean {
    return this.roles.has(slug)
  }

  /** Abilities for an unauthenticated visitor: nothing is permitted. */
  static guest() {
    return new UserAbilities(false, new Set(), new Set())
  }
}

export default class PermissionsService {
  /**
   * Resolves a user's roles and the union of their permissions in a single
   * query, rather than preloading the relation graph on the model.
   */
  static async forUser(user: User): Promise<UserAbilities> {
    const rows = await db
      .from('role_user')
      .join('roles', 'roles.id', 'role_user.role_id')
      .leftJoin('permission_role', 'permission_role.role_id', 'roles.id')
      .leftJoin('permissions', 'permissions.id', 'permission_role.permission_id')
      .where('role_user.user_id', user.id)
      .select('roles.slug as role_slug', 'permissions.slug as permission_slug')

    const roles = new Set<string>()
    const permissions = new Set<string>()

    for (const row of rows) {
      roles.add(row.role_slug)
      if (row.permission_slug) permissions.add(row.permission_slug)
    }

    return new UserAbilities(roles.has(SystemRole.ADMIN), permissions, roles)
  }
}
