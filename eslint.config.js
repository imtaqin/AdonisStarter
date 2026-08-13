import { configApp } from '@adonisjs/eslint-config'

export default [
  {
    /**
     * Vendor output, not our source. `public/theme` is the Imtaqin theme as
     * shipped and `template/` is the original HTML kit the showcase pages are
     * generated from -- linting either produces thousands of findings we would
     * never act on.
     */
    ignores: ['public/theme/**', 'template/**', '.playwright-mcp/**'],
  },
  ...configApp(),
]
