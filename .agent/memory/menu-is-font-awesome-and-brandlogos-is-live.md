---
title: config/menu.ts is Font Awesome only, and brandLogos actually drives the logos
kind: gotcha
tags: icons, branding, theme, conventions
updated: 2026-08-31
---
**Icons.** `config/menu.ts` uses Font Awesome (`fa-solid *`) exclusively — zero `ti ti-*`. Three sources used to claim otherwise, including `mcp/boost/tools/icons.ts`, which fed the wrong family to any agent that called `icon_styles`. All corrected: Tabler, Remix, Boxicons, Feather, Line Awesome and Bootstrap Icons belong to the **generated showcase pages**, not to the app nav. Keep them installed (the showcase needs them), but write new code in Font Awesome.

Component docblocks now say "Font Awesome class" where they said "Tabler icon class" (button, link, alert.root, ui.badge, ui.confirm, ui.dropdown, ui.empty, ui.stat). Those strings are what `list_components` shows an agent choosing an icon, so a wrong one there propagates. Still never guess a class — a wrong Font Awesome name renders blank with no error; call `search_icons`.

**Branding.** `config/dashboard.ts` is now genuinely the single source of truth for logos. `sidebar.edge`, `header.edge` and `layouts/auth.edge` previously hardcoded all fourteen `/theme/images/brand-logos/*.png` paths while the docs claimed the config controlled them, so swapping a logo there changed nothing. All three read the `brandLogos` global (defined in `start/view.ts`) now. Verified by pointing the config at a different filename and watching the rendered `<img src>` follow.
