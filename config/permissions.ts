/*
|--------------------------------------------------------------------------
| Permission catalogue
|--------------------------------------------------------------------------
|
| The single source of truth for what capabilities exist. The seeder syncs the
| `permissions` table from this list, route middleware references the slugs, and
| config/menu.ts uses them to hide nav entries.
|
| To add a permission:
|   1. add an entry below
|   2. grant it to the relevant roles in DEFAULT_ROLE_PERMISSIONS
|   3. run `node ace db:seed`
|   4. reference the slug from a route via middleware.permission({ permission })
|
| Slugs are `group.action`. The group is what the role editor buckets by.
|
*/

export const PERMISSIONS = [
  {
    slug: 'users.view',
    name: 'View users',
    group: 'users',
    description: 'See the user list and profiles',
  },
  {
    slug: 'users.manage',
    name: 'Manage users',
    group: 'users',
    description: 'Create, edit and delete users, and assign their roles',
  },

  {
    slug: 'roles.view',
    name: 'View roles',
    group: 'roles',
    description: 'See roles and their permissions',
  },
  {
    slug: 'roles.manage',
    name: 'Manage roles',
    group: 'roles',
    description: 'Create, edit and delete roles and change permission grants',
  },

  {
    slug: 'audit.view',
    name: 'View audit log',
    group: 'audit',
    description: 'Read the activity trail',
  },
] as const

export type PermissionSlug = (typeof PERMISSIONS)[number]['slug']

/**
 * Which roles get which permissions on a fresh install.
 *
 * `admin` is intentionally absent: the admin role short-circuits every check in
 * UserAbilities, so enumerating its grants would be misleading.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionSlug[]> = {
  manager: ['users.view', 'users.manage', 'roles.view', 'audit.view'],
  member: [],
}

export default PERMISSIONS
