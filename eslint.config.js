import { configApp } from '@adonisjs/eslint-config'

export default [
  {
    /**
     * Vendor output, not our source. `public/theme` is the Imtaqin theme and
     * `public/theme-velzon` the Velzon one, both as shipped; `template/` is the
     * original HTML kit the showcase pages are generated from -- linting any of
     * them produces thousands of findings we would never act on.
     */
    ignores: ['public/theme/**', 'public/theme-velzon/**', 'template/**', '.playwright-mcp/**'],
  },
  ...configApp(),
]
