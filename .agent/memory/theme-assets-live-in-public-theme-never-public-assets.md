---
title: Theme assets live in public/theme, never public/assets
kind: gotcha
tags: assets, vite, theme
updated: 2026-08-06
---
The Imtaqin vendor theme is served from `public/theme/`.

**Why not public/assets:** `config/vite.ts` sets `buildDirectory: "public/assets"`, and `vite build` empties its output directory. Putting the theme there means the first production build silently deletes 49MB of vendor assets and the app renders unstyled.

Consequence: every theme URL is `/theme/...`. `scripts/theme_transform.mjs` rewrites the template's original `../assets/` paths, and the theme's own JS files were rewritten in place for the same reason (they contained relative paths for the RTL stylesheet swap).
