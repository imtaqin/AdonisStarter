# AGENTS.md

Working notes for AI agents and humans. Read this before writing code — several
conventions here are non-obvious and will silently break the build if guessed at.

**Stack:** AdonisJS v7 (alpha) · Edge 6 · Lucid 22 (SQLite) · Bootstrap 5 via the
Imtaqin theme · Vite 7. No frontend framework — server-rendered hypermedia.

---

## 1. Non-obvious rules (read these first)

These five cost real debugging time. They are not guesses; each was verified
against the framework source or a running browser.

**1. `database/schema.ts` is generated, never edited.**
Lucid introspects the database after every `migration:run` and rewrites it.
To add a column: write a migration → run it → the model picks the column up.
Models stay thin and extend the generated class:

```ts
export default class Role extends RoleSchema {} // RoleSchema from #database/schema
```

Relationships go on the model with decorators, not in the generated file.

**2. Edge component tag names are camelCased from the file path.**
`edge.js` camelCases every path segment (`build/index.js:79`). So
`components/ui/empty_state.edge` is `@ui.emptyState`, **not** `@ui.empty_state` —
and a wrong name renders as literal text on the page instead of erroring.
To sidestep the trap entirely, component files in this project avoid
underscores: `components/ui/empty.edge` → `@ui.empty`.

**3. Block tags cannot appear inline inside an HTML tag.**
This is a compile error:

```edge
<th @if(column.width) style="width: {{ column.width }}" @endif>   {{-- ✗ --}}
```

Use ternary interpolation for conditional attributes:

```edge
<th style="{{ column.width ? `width: ${column.width}` : '' }}">{{-- ✓ --}}</th>
```

**4. `@each` needs a bare identifier.**
`@each(x in $props.get('items') || [])` is a compile error. Hoist first:

```edge
@let(items = $props.get('items') || [])
@each(item in items)
```

**5. A wrong icon class renders nothing — and does not error.**
Font Awesome Pro 7 is loaded in every layout and is the icon set for new work:

```edge
<i class="fa-solid fa-user"></i>
{{-- also: fa-regular fa-light fa-duotone fa-brands --}}
```

A misspelt icon name produces blank space with no warning anywhere, so **never
guess a class** — call the `search_icons` MCP tool, which returns the exact
string to paste. `icon_styles` lists what is shipped.

Only `solid, regular, light, duotone, brands` are vendored; `thin` and the
`sharp-*` family are omitted because they would add ~3MB of webfonts for
weights nothing uses. Add one to `STYLES` in `scripts/vendor-fontawesome.mjs`
and re-run `npm run theme:fontawesome` if you need it.

The theme also ships Tabler (`ti ti-*`), Remix, Boxicons, Feather, Line Awesome
and Bootstrap Icons. `config/menu.ts` and the showcase pages depend on them —
prefer Font Awesome for new code, but do not remove the others.

---

## 1b. Tooling — use it before reading files

This repo ships an MCP server, **adonis-boost**, that boots the real application
and answers questions about it. Its answers reflect what the framework actually
loaded, and cost far fewer tokens than a directory walk.

Open a session with these three calls:

```
memory_list           → decisions already made, so you don't redo them
project_conventions   → the rules in §1, machine-readable
git_status            → what the working tree looks like right now
```

Then as needed: `list_routes`, `list_components` (gives you the exact Edge tag
name — see rule 2), `database_schema`, `list_models`, `read_config`.

When something breaks: `clear_errors` → reproduce → `last_errors`. You cannot
see the developer's terminal; that tool is how you get the stack trace.

`eval` runs code inside the booted app (the Tinker equivalent). It can write —
do not run destructive code unless asked.

Record durable findings with `memory_write`, including the _why_. Notes live in
`.agent/memory/` and are committed.

Full reference, and setup for every other agent (Claude, Crush, Kimi, Cursor,
Gemini, Copilot, Windsurf, Cline, Aider, opencode):
**[docs/AI-TOOLING.md](./docs/AI-TOOLING.md)**.

Agent config files are generated — edit this file, then `npm run agents:sync`.

---

## 2. Layout of the codebase

```
.agent/memory/     committed project memory (memory_* MCP tools)
mcp/boost/         the adonis-boost MCP server
app/
  controllers/<Domain>/<Action>/index.ts   nested; see §3
  middleware/                              see §6
  models/                                  thin, extend #database/schema
  services/                                business logic, no HTTP concerns
  validators/                              VineJS schemas
config/
  menu.ts          sidebar navigation — the ONLY place to add a nav item
  permissions.ts   permission catalogue — the ONLY place to add a permission
  dashboard.ts     branding (app name, logos, page size)
  showcase.ts      GENERATED — do not edit
database/
  schema.ts        GENERATED — do not edit
  migrations/  seeders/
resources/views/
  components/      Edge components (see docs/COMPONENTS.md)
  layouts/         via components/layouts/{dashboard,auth,blank}.edge
  pages/           one folder per resource
  pages/showcase/  GENERATED reference markup — do not edit
  partials/dashboard/  shell: header, sidebar, footer, switcher, flash
scripts/
  convert-showcase-pages.mjs   regenerates pages/showcase + config/showcase.ts
start/
  routes/          one file per domain, see §4
  kernel.ts  limiter.ts  view.ts
public/theme/      Imtaqin vendor assets — treat as vendor output
```

`public/theme/` is deliberately **not** `public/assets/`: Vite's `buildDirectory`
is `public/assets` and `vite build` empties it, which would delete the theme.

---

## 3. Controllers

One action group per folder, `index.ts` inside it. The generated barrel
(`#generated/controllers`) mirrors the folder structure with lowercased
directory keys and a PascalCase file key:

| File                                     | Barrel reference                  |
| ---------------------------------------- | --------------------------------- |
| `app/controllers/User/List/index.ts`     | `controllers.user.list.Index`     |
| `app/controllers/Auth/Login/index.ts`    | `controllers.auth.login.Index`    |
| `app/controllers/AuditLog/List/index.ts` | `controllers.auditLog.list.Index` |
| `app/controllers/Dashboard/index.ts`     | `controllers.dashboard.Index`     |

Method convention: `show()` renders a form, `handle()` does the work. Single
action controllers just have `handle()`.

Take the whole `ctx` (not destructured params) in any action that writes to the
audit log — `AuditLogger` needs it for the actor, IP and user agent.

**Copy `app/controllers/User/` when adding a resource.** It is the reference
implementation: validate → mutate → audit → flash → redirect.

---

## 4. Routes

`start/routes/index.ts` imports one file per domain. Rules:

- **GET and POST only.** No PUT/PATCH/DELETE anywhere. A form URL serves the
  form on GET and accepts the submission on POST; deletes get an explicit
  `/:id/delete` POST endpoint.
- Every route is **named**, because `config/menu.ts` resolves nav entries with
  `route(...)`.
- Read and write permissions are separate (`users.view` vs `users.manage`), so
  a viewer cannot reach an edit screen.
- Anything rendering user data carries `middleware.noCache()`.

---

## 5. Adding things

**A page**

1. Controller at `app/controllers/<Domain>/<Action>/index.ts`
2. Route in `start/routes/<domain>.ts`, named, with `middleware.auth()` and a
   `middleware.permission({ permission })` if it is not public
3. View at `resources/views/pages/<domain>/<action>.edge` wrapped in
   `@layouts.dashboard({ title, subtitle })`
4. Nav entry in `config/menu.ts`

**A permission**

1. Add to `PERMISSIONS` in `config/permissions.ts`
2. Grant it in `DEFAULT_ROLE_PERMISSIONS`
3. `node ace db:seed` (idempotent)
4. Reference the slug from the route middleware

**A nav item** — `config/menu.ts` only. Never edit sidebar markup.
Nodes with a `permission` are hidden from users without it, and a group whose
children are all hidden disappears automatically.

---

## 6. Security

Mapped to OWASP Top 10. Do not remove these without a replacement.

| Risk                       | Where it is handled                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken access control  | `permission_middleware.ts` on every admin route; read/write split; `Showcase` validates `:page` against a generated allowlist                                     |
| A02 Cryptographic failures | scrypt password hashing (framework default); session cookie `httpOnly` + `secure` in prod + `sameSite=lax`                                                        |
| A03 Injection / XSS        | Bound query parameters everywhere; CSP in `config/shield.ts`; `toJson()` Edge global escapes `<` for inline scripts                                               |
| A04 Insecure design        | Rate limits in `start/limiter.ts`; self-delete and system-role deletion blocked; role delete refuses while users are attached                                     |
| A05 Misconfiguration       | `security_headers_middleware.ts`; `no_cache_middleware.ts`; HSTS/X-Frame/nosniff via shield                                                                       |
| A07 Auth failures          | Login throttled per IP+email; generic "invalid email or password" (no account enumeration); session regenerated on login/logout; inactive accounts cannot sign in |
| A08 Data integrity         | Explicit field lists on every `create`/`merge` — never spread the request body                                                                                    |
| A09 Logging failures       | `AuditLogger`; the audit trail is append-only and has no edit/delete route                                                                                        |

**Known weakness:** CSP allows `'unsafe-inline'` for scripts and styles because
the Imtaqin showcase pages ship inline handlers. Removing
`resources/views/pages/showcase/` lets you switch to nonces — see the comment in
`config/shield.ts`.

**`AUTH_BYPASS`** in `.env` signs every visitor in as the seeded admin so the
scaffold can be browsed without logging in. It throws if it ever runs with
`NODE_ENV=production`. Set it to `false` before doing real auth work.

---

## 7. Commands

```bash
npm run dev          # dev server + Vite (HMR)
npm run typecheck    # tsc --noEmit — run before declaring work done
npm run lint
node ace migration:run    # also regenerates database/schema.ts
node ace db:seed          # idempotent: permissions, roles, admin user
node scripts/convert-showcase-pages.mjs   # regenerate showcase pages
```

Seeded admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`
(`admin@example.com` / `ChangeMe123!`). The seeder never resets the password of
an account that already exists.

---

## 8. The showcase pages

`/showcase/:page` serves 98 Imtaqin template pages converted to Edge — a live
catalogue of the theme's markup. They are **reference, not application code**:
generated, overwritten by the converter, full of dummy data, and behind auth.

Use them to copy markup into a real page. When you no longer need them, delete
`resources/views/pages/showcase/`, `start/routes/showcase.ts`, the
`config/showcase.ts` file and the Template Reference section of `config/menu.ts`.
