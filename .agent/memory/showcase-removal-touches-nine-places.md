---
title: Removing the showcase touches nine places, and auth is not one of them
kind: gotcha
tags: showcase, navigation, auth, cleanup
updated: 2026-08-31
---
Deleting the template showcase is a nine-site change. Miss one and the app ships dead links. The full list is in AGENTS.md §8; the two that get missed most:

1. **`config/menu.ts` holds FIVE category dividers of showcase nav**, not one. `Template Reference`, `General`, `Pages and Forms`, `Web Apps`, `Tables & Charts` and `Maps & Icons` are all showcase-only. Older guidance said "the Template Reference section", which reads as one contiguous block and leaves the rest behind.
2. **`partials/dashboard/header.edge` and `search_modal.edge` hard-link into `/showcase/*`** (profile, settings, notifications, alerts, mail). These are shell chrome on every authenticated page, so leftovers are 404s users hit immediately.

Also: `config/shield.ts`'s `unsafe-inline` CSP allowance exists solely for showcase inline handlers — once the showcase is gone, switch to nonces.

**Auth is a separate boundary.** `pages/auth/*.edge` and `pages/errors/*.edge` are hand-written against real controllers and the converter skips them on purpose (`STANDALONE_PAGES` in `scripts/theme_transform.mjs`). `@layouts.auth` is the only sign-in style the app has. The theme's other auth screens (forgot-password, create-password, lock-screen, and the `authentication-cover` split-screen variant) exist ONLY as raw vendor HTML in `template/HTML/src/html/` and must be ported by hand into a controller + route + view. Never point a nav entry or link at a `/showcase/*` auth mockup — a dead group doing exactly that was removed, and those mockups compete with the real `/login`.
