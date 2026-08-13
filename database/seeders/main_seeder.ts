import { BaseSeeder } from '@adonisjs/lucid/seeders'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import Permission from '#models/permission'
import Role, { SystemRole } from '#models/role'
import User from '#models/user'
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from '#config/permissions'

/**
 * Idempotent: safe to re-run after adding a permission or role. Existing rows
 * are updated rather than duplicated, and the seeded admin password is only
 * applied when the account is first created.
 *
 *   node ace db:seed
 */
export default class extends BaseSeeder {
  async run() {
    const permissions = await this.#seedPermissions()
    const roles = await this.#seedRoles(permissions)
    await this.#seedAdmin(roles)
  }

  async #seedPermissions() {
    const permissions = new Map<string, Permission>()

    for (const definition of PERMISSIONS) {
      const permission = await Permission.updateOrCreate(
        { slug: definition.slug },
        { name: definition.name, group: definition.group, description: definition.description }
      )
      permissions.set(definition.slug, permission)
    }

    return permissions
  }

  async #seedRoles(permissions: Map<string, Permission>) {
    const definitions = [
      { slug: SystemRole.ADMIN, name: 'Administrator', description: 'Full access to everything' },
      {
        slug: SystemRole.MANAGER,
        name: 'Manager',
        description: 'Manages users and reviews activity',
      },
      {
        slug: SystemRole.MEMBER,
        name: 'Member',
        description: 'Signed-in user with no admin access',
      },
    ]

    const roles = new Map<string, Role>()

    for (const definition of definitions) {
      const role = await Role.updateOrCreate(
        { slug: definition.slug },
        { name: definition.name, description: definition.description, isSystem: true }
      )

      const grants = DEFAULT_ROLE_PERMISSIONS[definition.slug] ?? []
      const ids = grants
        .map((slug) => permissions.get(slug)?.id)
        .filter((id): id is number => Boolean(id))

      /**
       * `sync` rather than `attach` so removing a grant from
       * config/permissions.ts actually revokes it on the next seed.
       * The admin role is skipped: it bypasses checks anyway.
       */
      if (definition.slug !== SystemRole.ADMIN) {
        await role.related('permissions').sync(ids)
      }

      roles.set(definition.slug, role)
    }

    return roles
  }

  async #seedAdmin(roles: Map<string, Role>) {
    const email = env.get('ADMIN_EMAIL', 'admin@example.com')
    const password = env.get('ADMIN_PASSWORD', 'ChangeMe123!')

    const existing = await User.findBy('email', email)

    /**
     * Never reset the password of an account that already exists -- re-running
     * the seeder in an environment with real users must not hand out a known
     * credential.
     */
    const admin =
      existing ??
      (await User.create({
        email,
        password,
        fullName: 'Administrator',
        isActive: true,
      }))

    const adminRole = roles.get(SystemRole.ADMIN)
    if (adminRole) {
      await admin.related('roles').sync([adminRole.id], false)
    }

    if (!existing) {
      logger.info(`Seeded admin account ${email} -- change this password before deploying`)
    }
  }
}
