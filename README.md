# AdonisStarter

An AdonisJS admin dashboard scaffold, built so any coding agent can work in it
efficiently: a complete Edge component library, a hardened HTTP layer, and an
MCP server that answers questions about the running app.

Crafted by **[Imtaqin](https://imtaqin.id)**.

---

## Stack

AdonisJS 7 · Lucid 22 · Edge 6 · VineJS · Vite · Bootstrap 5 ·
Font Awesome Pro 7. SQLite by default, with PostgreSQL, MySQL, MSSQL and
libSQL selectable through `DB_CONNECTION`.

## What's in the box

- **Dashboard shell** from the Imtaqin theme, with the sidebar driven entirely by
  `config/menu.ts`
- **Users, roles and an audit log**, with a permission matrix and separate
  read and write permissions
- **Edge component library**: forms, tables, cards, alerts, badges, modals and
  more, documented in [docs/COMPONENTS.md](./docs/COMPONENTS.md)
- **A live showcase** of 98 template pages at `/showcase/*`, kept as reference
  markup
- **An icon browser** at `/icons` for the vendored Font Awesome Pro set
- **Security defaults** mapped to the OWASP Top 10: CSP, CSRF, rate limiting,
  session regeneration, audit logging. The app uses GET and POST only.

## Getting started

Requires Node.js 24 or newer.

```bash
npm install
cp .env.example .env
node ace generate:key
node ace migration:run
node ace db:seed
npm run dev
```

Open http://localhost:3333 and sign in as `admin@example.com` / `ChangeMe123!`,
or set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` before seeding.

To skip the login screen while scaffolding, set `AUTH_BYPASS=true`. It signs
every visitor in as the seeded admin, and throws on every request if it is
ever enabled in production.

> If you upgrade Node and every page returns a 500 mentioning
> `NODE_MODULE_VERSION`, run `npm rebuild better-sqlite3`.

## Working with AI agents

[AGENTS.md](./AGENTS.md) is the single source of truth for conventions. Config
files for Claude Code, Cursor, Crush, Kimi, Gemini, Copilot, opencode and
others are generated from it:

```bash
npm run agents:sync     # regenerate every agent config
npm run agents:check    # fail if any are stale
```

Every generated config wires up three MCP servers:

| Server         | What it gives an agent                                            |
| -------------- | ----------------------------------------------------------------- |
| `adonis-boost` | routes, schema, components, recent errors, memory and git context |
| `adonis-docs`  | the official AdonisJS, Lucid, Edge and VineJS docs                |
| `playwright`   | a real browser to verify that pages render                        |

The full tooling guide is [docs/AI-TOOLING.md](./docs/AI-TOOLING.md).

## Commands

```bash
npm run dev               # dev server with HMR
npm run build             # production build
npm run lint
npm run typecheck
npm run changeset         # every change ships a changeset
npm run changeset:check   # fails if the branch has changes but no changeset
npm run theme:fontawesome # re-vendor Font Awesome from the Pro bundle
```

## License

Private and unlicensed. Font Awesome Pro assets are included under the
owner's Pro licence and must not be redistributed.

---

Built by **[Imtaqin](https://imtaqin.id)**.
