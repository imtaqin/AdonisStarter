import vine from '@vinejs/vine'
import { THEME_KEYS } from '#config/themes'

/**
 * The theme key is checked against the config/themes.ts allowlist here and
 * again by `resolveTheme` when the layout reads it back. Two checks, because
 * this value ends up inside `<link href>` and a stored row outlives whatever
 * validated it (OWASP A03).
 */
export const updateThemeValidator = vine.create({
  theme: vine.enum(THEME_KEYS),
})
