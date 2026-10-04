---
'AdonisStarter': minor
---

Adds the Velzon admin template as nine selectable themes, and lets each user
pick one from Settings → Appearance.

Ten themes ship: Imtaqin, plus Velzon default, corporate, creative, galaxy,
interactive, material, minimal, modern and saas. The choice is stored per user
on `users.theme` and applies to that account alone.

Vendoring nine Velzon variants naively would have added ~1.15GB. They are
byte-identical apart from two files — `css/app.min.css` and
`css/bootstrap.min.css` — so `scripts/vendor-velzon.mjs` writes one shared tree
plus nine CSS pairs: 53MB. It also drops library authoring sources, rewrites the
variants' relative font and image URLs (they sit one directory deeper than the
template assumed), and guards six unchecked element lookups in `app.js`.

It also redacts credentials the template ships: the Leaflet demo carries a
working Mapbox access token, and committing it would publish somebody else's
credential — GitHub push protection rejects the push outright. Five were found
and replaced. The redaction is a re-scanning guard rather than a fixed list, so
a token added in a future Velzon release is caught too; the demo pages that
relied on them will not work.

That last one matters more than it sounds. Velzon's `app.js` is a single IIFE
that binds to demo markup we do not ship — notification dropdowns, the layout
customiser — without checking it exists, so the first missing element threw and
silently killed every initialiser after it. Optional chaining makes each a
no-op.

Pages did not change. `components/layouts/dashboard.edge` is now a dispatcher
that forwards props and slots to the shell named by `config/themes.ts`, so all
98 showcase pages and every application page render under either shell
untouched. Shells live in `components/layouts/themes/`.

`config/themes.ts` is an allowlist, not a lookup table: the key comes from a
user row and ends up inside `<link href>`, so it is validated on write by
`updateThemeValidator` and again on read by `resolveTheme()`, which falls back
to the default rather than throwing. Verified that `../../../etc/passwd`,
`https://evil.test/x.css`, a `<script>` payload, a traversal suffix and a
case-variant key are all rejected with nothing written, and that a POST without
a CSRF token is refused.

Also fixes a regression from the theme-switcher removal: `public/theme/js/custom.js`
still queried the deleted colour-picker containers, threw on every page load,
and — same single-IIFE problem — took the header theme toggle, Choices.js, the
footer year, node-waves, the card close/fullscreen buttons and back-to-top down
with it. The dead blocks are gone.

**Migrating:** run `node ace migration:run` for the `users.theme` column. To
re-vendor, extract the template **outside** the project and run
`npm run theme:velzon`; ~3600 files inside the working directory exhausts the
inotify watch limit and kills the dev server.
