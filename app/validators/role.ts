import vine from '@vinejs/vine'

/**
 * Slugs are lowercase, dot/dash separated and stable: policies and
 * config/menu.ts reference them, so they are validated strictly.
 */
const slug = () =>
  vine
    .string()
    .trim()
    .toLowerCase()
    .maxLength(80)
    .regex(/^[a-z][a-z0-9-]*$/)

export const createRoleValidator = vine.create({
  name: vine.string().trim().maxLength(120),
  slug: slug().unique({ table: 'roles', column: 'slug' }),
  description: vine.string().trim().maxLength(255).nullable(),
  permissionIds: vine
    .array(vine.number().exists({ table: 'permissions', column: 'id' }))
    .optional(),
})

export const updateRoleValidator = vine.withMetaData<{ roleId: number }>().create({
  name: vine.string().trim().maxLength(120),
  slug: slug().unique({
    table: 'roles',
    column: 'slug',
    filter: (query, _value, field) => {
      query.whereNot('id', field.meta.roleId)
    },
  }),
  description: vine.string().trim().maxLength(255).nullable(),
  permissionIds: vine
    .array(vine.number().exists({ table: 'permissions', column: 'id' }))
    .optional(),
})
