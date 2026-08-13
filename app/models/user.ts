import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role, { SystemRole } from '#models/role'

/**
 * User model represents a user in the application.
 * It extends UserSchema and includes authentication capabilities
 * through the withAuthFinder mixin.
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @manyToMany(() => Role, {
    pivotTable: 'role_user',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'role_id',
  })
  declare roles: ManyToMany<typeof Role>

  /**
   * True when any of the user's roles is the admin role. Requires `roles` to be
   * preloaded; prefer `PermissionsService.forUser()` when it might not be.
   */
  get isAdmin(): boolean {
    const roles = this.roles as Role[] | undefined
    return (roles ?? []).some((role) => role.slug === SystemRole.ADMIN)
  }

  hasRole(slug: string): boolean {
    const roles = this.roles as Role[] | undefined
    return (roles ?? []).some((role) => role.slug === slug)
  }

  /**
   * Get the user's initials from their full name or email.
   * Returns the first letter of first and last name if available,
   * otherwise returns the first two characters of the email username.
   */
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  /** Name to show in the UI, falling back to the email local part. */
  get displayName() {
    return this.fullName?.trim() || this.email.split('@')[0]
  }
}
