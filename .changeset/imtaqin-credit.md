---
'AdonisStarter': patch
---

Adds author credit: a "Crafted by Imtaqin" backlink to https://imtaqin.id in
the dashboard footer and under the card on the auth screens (login, signup),
plus `author` and `homepage` in `package.json`.

The name and URL live once, as `credit` in `config/dashboard.ts`, and reach
templates through a `credit` Edge global — the same route `appName` and
`brandLogos` already take — so neither layout hardcodes the link.

The link is a normal followed backlink: `target="_blank" rel="noopener"`,
deliberately without `nofollow`. `AGENTS.md` and the `project_conventions` MCP
tool both mark it as intentional author credit rather than template leftover,
so an agent tidying up markup does not strip or reword it.

**Migrating:** nothing. To change the credit, edit `credit` in
`config/dashboard.ts`.
