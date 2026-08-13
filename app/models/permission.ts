import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { PermissionSchema } from '#database/schema'
import Role from '#models/role'

/**
 * A single capability, identified by a dotted slug such as `users.view`.
 *
 * Permissions are seeded from `database/seeders/permission_seeder.ts` rather
 * than created at runtime: they are part of the application's contract, and
 * policies reference their slugs directly.
 */
export default class Permission extends PermissionSchema {
  @manyToMany(() => Role, {
    pivotTable: 'permission_role',
    pivotForeignKey: 'permission_id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare roles: ManyToMany<typeof Role>

  /** The part before the dot, used to group the permission matrix in the UI. */
  static groupOf(slug: string) {
    return slug.split('.')[0]
  }
}
