import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { RoleSchema } from '#database/schema'
import Permission from '#models/permission'
import User from '#models/user'

/** Slugs of the roles created by the seeder. */
export const SystemRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const

export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole]

export default class Role extends RoleSchema {
  @manyToMany(() => Permission, {
    pivotTable: 'permission_role',
    pivotForeignKey: 'role_id',
    pivotRelatedForeignKey: 'permission_id',
  })
  declare permissions: ManyToMany<typeof Permission>

  @manyToMany(() => User, {
    pivotTable: 'role_user',
    pivotForeignKey: 'role_id',
    pivotRelatedForeignKey: 'user_id',
  })
  declare users: ManyToMany<typeof User>

  /**
   * The admin role short-circuits every permission check, so a newly added
   * permission never locks administrators out of a screen.
   */
  get isAdmin() {
    return this.slug === SystemRole.ADMIN
  }
}
