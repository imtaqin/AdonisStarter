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

/*
|--------------------------------------------------------------------------
| Velzon layout options
|--------------------------------------------------------------------------
|
| Velzon drives its whole layout from `data-*` attributes on <html>: the four
| layout modes, the sidebar and topbar colours, dark mode. Its own layout.js
| reads them before paint and rebuilds the menu accordingly -- horizontal and
| twocolumn need no extra markup, which is why all of this costs nothing but a
| few attributes.
|
| Keys and values below were read out of the template's own customiser markup,
| not invented. They apply to the Velzon shells; the Imtaqin shell ignores them.
|
*/

export type LayoutSetting = {
  /** The attribute rendered on <html>. */
  attr: string
  label: string
  /** Allowed values, first one is the default. */
  values: readonly string[]
  description?: string
}

export const LAYOUT_SETTINGS = {
  layout: {
    attr: 'data-layout',
    label: 'Layout',
    values: ['vertical', 'horizontal', 'twocolumn', 'semibox'],
    description: 'Where the navigation lives.',
  },
  mode: {
    attr: 'data-bs-theme',
    label: 'Mode',
    values: ['light', 'dark'],
  },
  sidebar: {
    attr: 'data-sidebar',
    label: 'Sidebar colour',
    values: ['dark', 'light', 'gradient', 'gradient-2', 'gradient-3', 'gradient-4'],
  },
  topbar: {
    attr: 'data-topbar',
    label: 'Topbar colour',
    values: ['light', 'dark'],
  },
  sidebarSize: {
    attr: 'data-sidebar-size',
    label: 'Sidebar size',
    values: ['lg', 'md', 'sm', 'sm-hover'],
  },
  width: {
    attr: 'data-layout-width',
    label: 'Width',
    values: ['fluid', 'boxed'],
  },
  position: {
    attr: 'data-layout-position',
    label: 'Position',
    values: ['fixed', 'scrollable'],
  },
  style: {
    attr: 'data-layout-style',
    label: 'Style',
    values: ['default', 'detached'],
  },
  sidebarImage: {
    attr: 'data-sidebar-image',
    label: 'Sidebar image',
    values: ['none', 'img-1', 'img-2', 'img-3', 'img-4'],
  },
} as const satisfies Record<string, LayoutSetting>

export type LayoutSettingKey = keyof typeof LAYOUT_SETTINGS

export const LAYOUT_SETTING_KEYS = Object.keys(LAYOUT_SETTINGS) as LayoutSettingKey[]

export type LayoutOptions = Record<LayoutSettingKey, string>

export function defaultLayoutOptions(): LayoutOptions {
  return Object.fromEntries(
    LAYOUT_SETTING_KEYS.map((key) => [key, LAYOUT_SETTINGS[key].values[0]])
  ) as LayoutOptions
}

/**
 * Resolves a stored JSON blob to a complete, valid set of options.
 *
 * Every value is checked against its allowlist because these end up as
 * attribute values on <html>; anything unknown silently falls back to the
 * default rather than being echoed into the document.
 */
export function resolveLayoutOptions(raw: unknown): LayoutOptions {
  const options = defaultLayoutOptions()

  let parsed: unknown = raw
  if (typeof raw === 'string' && raw.trim()) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      /* A corrupt column is not worth a 500; the defaults are a fine answer. */
      return options
    }
  }

  if (!parsed || typeof parsed !== 'object') return options

  for (const key of LAYOUT_SETTING_KEYS) {
    const value = (parsed as Record<string, unknown>)[key]
    if (
      typeof value === 'string' &&
      (LAYOUT_SETTINGS[key].values as readonly string[]).includes(value)
    ) {
      options[key] = value
    }
  }

  return options
}

/** The resolved options as the attribute string the Velzon shells render. */
export function layoutAttributes(options: LayoutOptions): string {
  return LAYOUT_SETTING_KEYS.map((key) => `${LAYOUT_SETTINGS[key].attr}="${options[key]}"`).join(
    ' '
  )
}
