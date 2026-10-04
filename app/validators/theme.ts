import vine from '@vinejs/vine'
import { LAYOUT_SETTINGS, THEME_KEYS } from '#config/themes'

/**
 * The theme key is checked against the config/themes.ts allowlist here and
 * again by `resolveTheme` when the layout reads it back. Two checks, because
 * this value ends up inside `<link href>` and a stored row outlives whatever
 * validated it (OWASP A03).
 */
export const updateThemeValidator = vine.create({
  theme: vine.enum(THEME_KEYS),
})

/**
 * Layout options. Written out field by field rather than generated from
 * LAYOUT_SETTINGS: a loop produces a schema TypeScript cannot narrow, and the
 * cast needed to silence it would hide a genuine mismatch.
 *
 * The value lists still come from the config, so adding a value there is enough
 * -- only a brand new setting needs a line here.
 *
 * Every field is optional so a partial form submits cleanly; the controller
 * merges over the stored options.
 */
const option = (key: keyof typeof LAYOUT_SETTINGS) =>
  vine.enum(LAYOUT_SETTINGS[key].values as readonly string[]).optional()

export const updateLayoutValidator = vine.create({
  layout: option('layout'),
  mode: option('mode'),
  sidebar: option('sidebar'),
  topbar: option('topbar'),
  sidebarSize: option('sidebarSize'),
  width: option('width'),
  position: option('position'),
  style: option('style'),
  sidebarImage: option('sidebarImage'),
})
