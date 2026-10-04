/*
|--------------------------------------------------------------------------
| Dashboard themes
|--------------------------------------------------------------------------
|
| The shell can render in more than one admin style. Each theme names the
| layout component that draws its shell and the assets that style it.
|
| This file is the allowlist. A theme key arriving from a form, a session or
| the database is only honoured when it appears here, so an attacker cannot
| steer `<link href>` at a path of their choosing (OWASP A03).
|
| Adding a Velzon variant: vendor it with `npm run theme:velzon` (the variant
| list lives in scripts/vendor-velzon.mjs), then add an entry below. Nothing
| else changes -- the picker, the validator and the layout all read this file.
|
*/

/** Where a theme's shell markup and its asset base live. */
export type ThemeDefinition = {
  /** Shown in the picker. */
  label: string
  /** Family heading in the picker, so nine Velzon rows do not read as nine themes. */
  family: string
  /** Edge component that draws the shell, relative to resources/views. */
  layout: string
  /** Public URL prefix for this theme's own stylesheets. */
  assets: string
  /** One-line description for the picker. */
  description: string
}

export const THEMES = {
  'imtaqin': {
    label: 'Imtaqin',
    family: 'Imtaqin',
    layout: 'components/layouts/themes/imtaqin',
    assets: '/theme',
    description: 'The original shell. Font Awesome Pro icons, compact sidebar.',
  },

  /*
  | The nine Velzon variants share one asset tree and differ only in two CSS
  | files -- see the comment at the top of scripts/vendor-velzon.mjs.
  */
  'velzon-default': {
    label: 'Default',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/default',
    description: 'Velzon stock: dark sidebar, light topbar.',
  },
  'velzon-corporate': {
    label: 'Corporate',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/corporate',
    description: 'Restrained palette, squarer corners.',
  },
  'velzon-creative': {
    label: 'Creative',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/creative',
    description: 'Higher contrast accents and rounder cards.',
  },
  'velzon-galaxy': {
    label: 'Galaxy',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/galaxy',
    description: 'Dark-leaning with a violet accent.',
  },
  'velzon-interactive': {
    label: 'Interactive',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/interactive',
    description: 'Softer surfaces, more pronounced hover states.',
  },
  'velzon-material': {
    label: 'Material',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/material',
    description: 'Material-style elevation and ink colours.',
  },
  'velzon-minimal': {
    label: 'Minimal',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/minimal',
    description: 'Flat, borderless, minimum chrome.',
  },
  'velzon-modern': {
    label: 'Modern',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/modern',
    description: 'Wide spacing and a cooler neutral palette.',
  },
  'velzon-saas': {
    label: 'SaaS',
    family: 'Velzon',
    layout: 'components/layouts/themes/velzon',
    assets: '/theme-velzon/saas',
    description: 'Product-marketing palette, bolder primaries.',
  },
} as const satisfies Record<string, ThemeDefinition>

export type ThemeKey = keyof typeof THEMES

/** Used when a user has not chosen one, and when a stored key is no longer valid. */
export const DEFAULT_THEME: ThemeKey = 'imtaqin'

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[]

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === 'string' && Object.hasOwn(THEMES, value)
}

/**
 * Resolves any untrusted value to a usable theme. Never throws: a removed or
 * tampered key degrades to the default rather than breaking every page for a
 * user whose stored theme no longer exists.
 */
export function resolveTheme(value: unknown): ThemeDefinition & { key: ThemeKey } {
  const key = isThemeKey(value) ? value : DEFAULT_THEME
  return { key, ...THEMES[key] }
}

/** Themes grouped by family, for rendering the picker. */
export function themesByFamily(): {
  family: string
  themes: (ThemeDefinition & { key: ThemeKey })[]
}[] {
  const groups = new Map<string, (ThemeDefinition & { key: ThemeKey })[]>()

  for (const key of THEME_KEYS) {
    const theme = { key, ...THEMES[key] }
    const bucket = groups.get(theme.family) ?? []
    bucket.push(theme)
    groups.set(theme.family, bucket)
  }

  return [...groups].map(([family, themes]) => ({ family, themes }))
}
