import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password().confirmed({
    confirmationField: 'passwordConfirmation',
  }),
})

/**
 * Administrator creating a user from the Users screen. Unlike signup, this form
 * assigns roles and can create the account in a deactivated state.
 */
export const createUserValidator = vine.create({
  fullName: vine.string().trim().maxLength(120).nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  isActive: vine.boolean().optional(),
  roleIds: vine.array(vine.number().exists({ table: 'roles', column: 'id' })).optional(),
})

/**
 * Administrator editing an existing user.
 *
 * The uniqueness check excludes the row being edited, otherwise resubmitting an
 * unchanged email would report it as taken. Password is optional -- an empty
 * field means "leave the current password alone".
 */
export const updateUserValidator = vine.withMetaData<{ userId: number }>().create({
  fullName: vine.string().trim().maxLength(120).nullable(),
  email: email().unique({
    table: 'users',
    column: 'email',
    filter: (query, _value, field) => {
      query.whereNot('id', field.meta.userId)
    },
  }),
  password: password().optional(),
  isActive: vine.boolean().optional(),
  roleIds: vine.array(vine.number().exists({ table: 'roles', column: 'id' })).optional(),
})
