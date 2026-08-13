import Permission from '#models/permission'

export type PermissionGroup = {
  name: string
  permissions: Permission[]
}

/**
 * Shared by the role create/edit screens: permissions bucketed by their `group`
 * column so the form can render a checkbox matrix.
 */
export default class PermissionCatalog {
  static async grouped(): Promise<PermissionGroup[]> {
    const permissions = await Permission.query().orderBy('group').orderBy('slug')

    const groups = new Map<string, Permission[]>()
    for (const permission of permissions) {
      const bucket = groups.get(permission.group) ?? []
      bucket.push(permission)
      groups.set(permission.group, bucket)
    }

    return [...groups.entries()].map(([name, items]) => ({ name, permissions: items }))
  }
}
