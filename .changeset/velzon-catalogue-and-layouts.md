---
'AdonisStarter': minor
---

Adds the full Velzon catalogue and its layout modes.

**167 catalogue pages.** `scripts/convert-velzon-pages.mjs` converts the Velzon
dist into `resources/views/pages/velzon/*.edge`, served at `/velzon/:page` with
an index at `/velzon` that groups and searches them. Unlike the Imtaqin
template, Velzon's dist is already expanded, so the converter extracts rather
than resolves includes: the page body out of `.page-content > .container-fluid`,
the title and breadcrumb out of `.page-title-box`, and the per-page `<link>` and
`<script>` tags, skipping the ones the shell already loads. 26 standalone pages
(sign-in, 404, landing, email templates) are skipped — they are whole documents,
not dashboard pages.

These pages call the Velzon shell directly instead of going through the theme
dispatcher, so the catalogue always looks like Velzon no matter which theme the
viewer has chosen. Showing it under Imtaqin's stylesheet would misrepresent the
markup. That required guarding the Velzon shell's optional slots: the dispatcher
always defines them, a page calling the shell directly does not.

**All layout modes.** Velzon's four layouts (vertical, horizontal, twocolumn,
semibox) plus sidebar colour, topbar colour, sidebar size, width, position,
style and dark mode are now per-user settings, picked on the same Appearance
screen. They are `data-*` attributes on `<html>` and nothing more — Velzon's
`layout.js` reads them before paint and rebuilds the menu from the existing
markup, which is why horizontal and twocolumn need no second shell and the whole
feature adds no assets.

Allowed values were read out of the template's own customiser rather than
guessed. They are stored as JSON in `users.theme_options` and validated twice —
on write by `updateLayoutValidator`, on read by `resolveLayoutOptions()` — since
they are interpolated into the `<html>` tag. Verified that
`layout=vertical" onload="alert(1)` and an unknown mode are both rejected with
the stored values left intact, and that a corrupt JSON column degrades to the
defaults instead of raising.

All 167 pages were requested and returned 200.

**Migrating:** run `node ace migration:run` for `users.theme_options`.
Regenerate the catalogue with `npm run theme:velzon-pages`.
