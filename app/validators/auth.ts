import vine from '@vinejs/vine'

/**
 * Login input.
 *
 * Deliberately loose on the password: enforcing a length rule here would tell
 * an attacker their guess was structurally wrong before it was ever checked.
 */
export const loginValidator = vine.create({
  email: vine.string().trim().email().maxLength(254),
  password: vine.string(),
  rememberMe: vine.boolean().optional(),
})

export const forgotPasswordValidator = vine.create({
  email: vine.string().trim().email().maxLength(254),
})
