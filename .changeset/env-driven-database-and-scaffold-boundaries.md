---
'AdonisStarter': major
---

The database is now selected by `DB_CONNECTION`, and the scaffold boundaries that
agents kept guessing at — showcase cleanup, the auth style, nav icons — are
written down where they will be read.

**Database.** `config/database.ts` hardcoded `connection: 'sqlite'` and shipped
Postgres, MySQL, MSSQL and libSQL commented out. `start/env.ts` and
`.env.example` had no `DB_*` variables at all, so an agent asked to "use
Postgres" had no supported way to do it and silently wrote another SQLite
migration. All five connections are now live and the default reads
`env.get('DB_CONNECTION', 'sqlite')`, with `DB_HOST/PORT/USER/PASSWORD/DATABASE`,
`DB_FILENAME` and `LIBSQL_URL`/`LIBSQL_AUTH_TOKEN` declared in the env schema and
documented per driver in `.env.example`. SQLite stays the zero-config default, so
an existing checkout behaves exactly as before.

Two driver notes are recorded in the config rather than rediscovered: MSSQL's
`server` is a required `string` in Lucid's types, so it falls back to
`localhost`; and Lucid's `LibSQLConfig` still declares `filename` while Turso's
runtime wants `url` + `authToken`, so that one connection object carries a
narrow `as unknown as { filename: string }` with the reason beside it.

**Dead navigation.** The sidebar's "Authentication" group pointed at five
`/showcase/*` slugs — `under-construction`, `create-password`, `lock-screen`,
`404`, `500` — that the converter never generates (`STANDALONE_PAGES` in
`scripts/theme_transform.mjs` skips them). Every one rendered as a live link that
404s, and they advertised fake auth screens next to the real `/login`. The group
is gone. `scripts/theme_transform.mjs` also mapped `forgot-password` to a route
that does not exist; that entry and the unreferenced `forgotPasswordValidator`
are removed rather than left as scaffolding nobody wired up.

**Cleanup boundary.** `AGENTS.md` §8 told agents to delete four things when
removing the showcase. There are nine, and missing one ships dead links: the
header dropdown (`/showcase/profile`, `/showcase/settings`), the search modal
(three more), the `unsafe-inline` CSP allowance that exists only for showcase
markup, both converter scripts, and — the trap — `config/menu.ts` holds *five*
category dividers of showcase nav, not the single "Template Reference section"
the doc named. §8 now lists all nine and states the auth boundary explicitly:
`pages/auth/` and `pages/errors/` are hand-written, never regenerated,
`@layouts.auth` is the only sign-in style the app has, and the theme's other auth
screens exist only as raw HTML under `template/` and must be ported by hand.

**Icons.** Three places claimed `config/menu.ts` uses Tabler (`ti ti-*`) — it is
100% Font Awesome. The worst offender was `mcp/boost/tools/icons.ts`, which fed
that claim to every agent through `icon_styles`. `AGENTS.md`, `docs/COMPONENTS.md`
and the MCP tool now attribute Tabler to the generated showcase pages, and eight
component docblocks say "Font Awesome class" instead of "Tabler icon class" —
those strings are what `list_components` shows an agent about to pick an icon.
`docs/COMPONENTS.md` also cited a "§1 rule 4b" that does not exist (it is rule 5),
and the agent-config generator said "Four behaviours" for a five-rule section.

**Branding.** `config/dashboard.ts` was documented as the single source of truth
for logos while `sidebar.edge`, `header.edge` and `layouts/auth.edge` hardcoded
all fourteen paths, so changing it did nothing. All three now read the
`brandLogos` global. Verified by pointing the config at a different filename and
confirming the rendered `<img src>` followed.

**Migrating:** nothing is required for an existing checkout — omitting
`DB_CONNECTION` keeps SQLite. To switch databases set `DB_CONNECTION` plus that
driver's variables and install its package (`pg`, `mysql2`, `tedious`, or
`@libsql/client @libsql/sqlite3`). If you imported `forgotPasswordValidator`,
that export is gone; build the route and controller alongside it if you need it.
Run `npm run agents:sync` so the regenerated context files pick up the corrected
rule count.
