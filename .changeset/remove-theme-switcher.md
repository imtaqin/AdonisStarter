---
'AdonisStarter': minor
---

Removes the theme switcher — the gear in the header, the offcanvas panel behind
it, and the assets that only existed to serve it.

Gone: the `.switcher-icon` gear button in `partials/dashboard/header.edge`,
`partials/dashboard/switcher.edge` (696 lines of template markup),
`/theme/js/custom-switcher.min.js`, and the `@simonwep/pickr` colour picker CSS
and JS, which nothing else used. `flatpickr` is a different library and stays —
it is the date picker used by several forms.

The panel let a visitor recolour the whole app at runtime. That is a demo
feature for a template preview, not something a dashboard should ship, and it
made the rendered theme depend on per-browser `localStorage` rather than on the
code.

Defaults are unaffected: `data-theme-mode="light"` and the layout attributes are
hardcoded on the `<html>` tag in `components/layouts/dashboard.edge`, so the
app renders exactly as before for a fresh visitor. `main.js` still runs before
paint and still restores a saved theme from `localStorage`.

**Migrating:** a browser that used the switcher before this change still has its
old choice in `localStorage` and will keep rendering it, with no UI left to
change it back. Clear site data for the origin, or set `data-theme-mode` on the
`<html>` tag if you want to force one. To restore the panel, take
`switcher.html` from `template/HTML/src/html/partials/`.
