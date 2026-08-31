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
and Bootstrap Icons. The generated showcase pages depend on them —
`config/menu.ts` is Font Awesome only. Prefer Font Awesome for new code, but do
not remove the other sets.

---

## 1a. Documentation — read it before you write framework code

This stack is **AdonisJS v7 alpha, Lucid 22, Edge 6, VineJS**. All four moved
recently, and the APIs you remember are frequently the previous major. Guessing
here does not raise a type error — it produces code that silently does nothing
(a mistyped Edge tag renders as literal text; a wrong Lucid decorator just never
loads the relation).

So: **before writing code against any framework API, look it up.** The
`adonis-docs` MCP server serves the official docs and ships in every generated
agent config:

```
detect_version   → confirm which major you are actually on
search_docs      → find the page for the thing you are about to write
get_doc          → read it
```

Mandatory before you touch:

| You are about to write                 | Read first                           |
| -------------------------------------- | ------------------------------------ |
| a model, relation, query, or migration | Lucid — relationships, query builder |
| an Edge template, component, or slot   | Edge — components, slots, escaping   |
| a validator                            | VineJS — schema, custom rules        |
| a route, middleware, or exception      | AdonisJS core — HTTP, middleware     |
| auth, session, shield, or limiter      | the docs for that package            |

Two things the docs will not tell you, because they are ours: the rules in §1
below, and what the app actually loaded right now — that is `adonis-boost` in
§1b. Use both. `search_docs` tells you the API exists; `list_components` and
`database_schema` tell you what this codebase named it.

If the docs and this file disagree, **this file wins** — it records deviations
we made deliberately. Say so rather than silently following the docs.

Never paste an API from memory and let the browser find out. If you could not
confirm it in the docs, say that in your reply instead of shipping a guess.

---

## 1b. Tooling — use it before reading files

This repo ships an MCP server, **adonis-boost**, that boots the real application
and answers questions about it. Its answers reflect what the framework actually
loaded, and cost far fewer tokens than a directory walk.

Open a session with these three calls:

```
memory_list           → decisions already made, AND any unfinished work
project_conventions   → the rules in §1, machine-readable
git_status            → what the working tree looks like right now
```

Then as needed: `list_routes`, `list_components` (gives you the exact Edge tag
name — see rule 2), `database_schema`, `list_models`, `read_config`.

When something breaks: `clear_errors` → reproduce → `last_errors`. You cannot
see the developer's terminal; that tool is how you get the stack trace.

`eval` runs code inside the booted app (the Tinker equivalent). It can write —
do not run destructive code unless asked.

### One context, every agent, across sessions

`.agent/memory/` is **shared and committed**. Every agent wired to this repo —
Claude, Cursor, Gemini, Kimi, Cline, Copilot, Crush, opencode, Codex, Antigravity — reads
and writes the same notes through the same MCP server, so context crosses tools,
machines and days. Memory that only exists in one chat history is not context.

Two kinds of memory, do not mix them:

| Tool              | Holds                          | Lifetime                    |
| ----------------- | ------------------------------ | --------------------------- |
| `memory_write`    | decisions, gotchas, preferences | outlives the task, with the _why_ |
| `session_handoff` | the task still in flight        | until the work is finished  |

**Starting.** `memory_list` answers `resuming: true` when the previous session
left work unfinished. Read that handoff and continue it — do not start over and
do not redo what it lists as verified.

**Stopping mid-task.** Call `session_handoff` with the goal in the requester's
own words, what is done _and how you verified it_, what is next in order, and the
dead ends already tried. What is not in the handoff did not happen.

**Finishing.** `session_handoff` with `done_all: true` clears the baton. A stale
handoff read as live work by the next agent is worse than no handoff at all.

There is exactly one open handoff at a time (`.agent/memory/session-handoff.md`).
One baton is a queue; several are an argument.

Full reference, and setup for every other agent (Claude, Kimi, Cursor,
Gemini, Copilot, Cline, Crush, opencode):
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
  pages/auth/  pages/errors/   hand-written, never generated — see §8
  pages/showcase/  GENERATED reference markup — do not edit
  partials/dashboard/  shell: header, sidebar, footer, flash, loader, search_modal
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

**Every controller lives at `app/controllers/<Domain>/<Action>/index.ts`.**
Three segments, always. There is no two-segment form: a domain with a single
screen still gets an action folder named `Index`
(`app/controllers/Profile/Index/index.ts`), never `app/controllers/Profile/index.ts`.
One class per file, `export default`, one action group per folder.

`<Domain>` is PascalCase and singular (`User`, `Role`, `AuditLog`, `OrgUnit`).
`<Action>` comes from this vocabulary — do not invent synonyms:

| Action   | Serves                                                    | Methods              |
| -------- | --------------------------------------------------------- | -------------------- |
| `List`   | the index/table screen                                    | `handle()`           |
| `Create` | `GET create` form + `POST create`                         | `show()`, `handle()` |
| `Update` | `GET :id/edit` form + `POST :id/edit`                     | `show()`, `handle()` |
| `Delete` | `POST :id/delete`                                         | `handle()`           |
| `Show`   | a read-only detail screen                                 | `handle()`           |
| `Index`  | a domain that is one screen (Profile, Setting, Dashboard) | `handle()`           |

`show()` renders a form, `handle()` does the work. A controller that only reads
has `handle()` alone. Note the split: the **route** is named `users.edit`, the
**controller** is `User/Update` — the folder is named after the mutation, not
after the URL.

HTTP controllers sit at the root of `app/controllers/`. JSON controllers for the
mobile/API surface go under an `Api/` domain prefix that mirrors the same shape:
`app/controllers/Api/<Domain>/<Action>/index.ts`. Nothing else is allowed at the
top level.

The generated barrel (`#generated/controllers`) mirrors the folders with
lowercased directory keys and a PascalCase file key, so the path is the route
reference:

| File                                       | Barrel reference                    |
| ------------------------------------------ | ----------------------------------- |
| `app/controllers/User/List/index.ts`       | `controllers.user.list.Index`       |
| `app/controllers/User/Update/index.ts`     | `controllers.user.update.Index`     |
| `app/controllers/AuditLog/List/index.ts`   | `controllers.auditLog.list.Index`   |
| `app/controllers/Dashboard/Index/index.ts` | `controllers.dashboard.index.Index` |
| `app/controllers/Api/Auth/Login/index.ts`  | `controllers.api.auth.login.Index`  |

Take the whole `ctx` (not destructured params) in any action that writes to the
audit log — `AuditLogger` needs it for the actor, IP and user agent.

**Copy `app/controllers/User/` when adding a resource.** It is the reference
implementation: four action folders, and each `handle()` runs
validate → mutate → audit → flash → redirect.

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
npm run agents:check      # agent configs in sync with this file
npm run changeset         # record a change note (see §9)
```

Seeded admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`
(`admin@example.com` / `ChangeMe123!`). The seeder never resets the password of
an account that already exists.

---

## 8. The showcase pages

`/showcase/:page` serves 98 Imtaqin template pages converted to Edge — a live
catalogue of the theme's markup. They are **reference, not application code**:
generated, overwritten by the converter, full of dummy data, and behind auth.

Use them to copy markup into a real page.

**Auth and error screens are NOT showcase pages.** `pages/auth/*.edge` and
`pages/errors/*.edge` are hand-written against real controllers and the
converter skips them on purpose (`scripts/theme_transform.mjs` `STANDALONE_PAGES`).
`@layouts.auth` is the only sign-in style the app has; the theme's other auth
screens (forgot-password, create-password, lock-screen, cover/split-screen) exist
only as raw vendor HTML in `template/HTML/src/html/` and must be ported by hand
into a real controller + route + view if you want them. Never wire a nav entry or
a link to a `/showcase/*` auth mockup — they compete with the real `/login`.

### Removing the showcase

Deleting it touches **nine** places, not four. Miss one and you ship dead links:

1. `resources/views/pages/showcase/`
2. `start/routes/showcase.ts`
3. `config/showcase.ts` and `app/controllers/Showcase/`
4. `scripts/convert-showcase-pages.mjs` and `scripts/theme_transform.mjs`
5. `config/menu.ts` — everything from the `Template Reference` divider to the end
   of the array. That is **five** category dividers (`Template Reference`,
   `General`, `Pages and Forms`, `Web Apps`, `Tables & Charts`, `Maps & Icons`),
   not one contiguous section.
6. `resources/views/partials/dashboard/header.edge` — the `/showcase/profile` and
   `/showcase/settings` links in the profile dropdown
7. `resources/views/partials/dashboard/search_modal.edge` — the
   `/showcase/notifications`, `/showcase/alerts` and `/showcase/mail` links
8. `config/shield.ts` — the `'unsafe-inline'` CSP allowance exists only for the
   showcase's inline handlers; switch to nonces once it is gone
9. `template/` — the vendor source, if you no longer need to regenerate

---

## 9. Changesets — every task ships one

**No work is finished without a changeset.** Not "when a rule changes", not
"when it feels significant" — every task. If you touched the repo, you write
one before you report done, in the same breath as `npm run typecheck`.

```bash
npm run changeset        # write the note, pick the bump
npm run changeset:check  # fails if the branch has changes and no changeset
npm run version          # consume .changeset/*.md -> CHANGELOG.md + package.json
```

This scaffold is a private single package — nothing is published to npm. There
is no publish step; do not run `changeset publish`. Changesets is used for one
thing: turning intent into `CHANGELOG.md`, so the next agent learns _what
changed and why_ without doing archaeology through commit messages.

That is also why the note is prose, not a commit subject. Write what a future
agent needs: what the old behaviour was, what it is now, and what made the
change necessary. `git log` already records which lines moved — the changeset is
for the part git cannot store.

The bump answers "what must a consumer of this scaffold do about it?"

| Bump    | Means                                                          |
| ------- | -------------------------------------------------------------- |
| `major` | a rule changed such that existing code is now wrong            |
| `minor` | new capability — a component, MCP tool, middleware, convention |
| `patch` | a fix, a clarification, or a doc edit that breaks nothing      |

A `major` changeset must end with a **Migrating:** paragraph naming the exact
mechanical edit. If you cannot write that paragraph, the change is not ready.

The only exemptions are changes that cannot affect anyone reading the repo:
lockfile-only updates, and edits confined to `.changeset/` itself.
`changeset:check` already encodes exactly this list — if it passes, you are done.

---

## 10. Working from a folder of documents

When you are pointed at a directory of specs, notes or markdown — "implement
what's in `docs/spec/`" — the danger is not the code. It is that reading twenty
files fills your context, the original task falls out of it, and you finish
something adjacent to what was asked. Context is not durable. Follow this.

**1. Index before you read.** List the folder and read only each file's title
and headings. Build a one-line-per-file map. Do not bulk-read the directory into
context — that is the mistake the rest of this protocol exists to prevent.

**2. Write the ledger before you write any code.** One `memory_write` note,
kind `todo`, containing:

- the task in a single sentence, in the requester's own words
- the source folder, and which files are in scope
- a checklist: one line per unit of work, each `[ ]` / `[x]` / `[skip: why]`
- an **Open questions** list for contradictions you hit

This note — not your context window — is the source of truth for what you are
doing. Reuse the same `slug` on every update so it stays one note.

**3. Work one checklist item at a time.** Read that item's file _when you reach
it_, implement, verify, then `memory_write` the ledger with the box ticked. If
you are interrupted or compacted, `memory_list` recovers the whole task.

**4. Reconcile, do not transcribe.** Specs describe intent; §1, §1a and §3
describe how this codebase does things. Where a document contradicts them,
**this repo wins** — record the conflict under Open questions and say so in
your reply. A spec that predates a convention is not permission to break it.

**5. Never silently narrow scope.** If the folder is larger than the work you
can finish, say what you left out and why. A `[skip: ...]` line in the ledger
is honest; a checklist quietly missing three files is not.

**6. Finish per §9** — a changeset, and the ledger note deleted with
`memory_delete` once every box is ticked. A stale `todo` note read as live work
by the next agent is worse than no note at all.

The ledger costs about thirty seconds. It is the difference between an
interruption costing you one item and costing you the entire task.
