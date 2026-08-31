---
title: Database driver is chosen by DB_CONNECTION, not by editing config
kind: decision
tags: database, lucid, env, conventions
updated: 2026-08-31
---
`config/database.ts` registers all five Lucid connections (sqlite, pg, mysql, mssql, libsql) and the default comes from `env.get('DB_CONNECTION', 'sqlite')`.

**Why this exists:** the file previously hardcoded `connection: 'sqlite'` and kept every other driver commented out, and `start/env.ts` declared no `DB_*` variables. An agent told to "use Postgres" had no supported path, so it kept writing SQLite migrations. The env var is the switch; never edit the config to change databases.

To switch: set `DB_CONNECTION` plus that driver's vars (`DB_HOST/PORT/USER/PASSWORD/DATABASE`, or `LIBSQL_URL`/`LIBSQL_AUTH_TOKEN`) and install the package (`pg`, `mysql2`, `tedious`, `@libsql/client @libsql/sqlite3`). SQLite needs nothing and remains the default; `DB_FILENAME` overrides its path.

Two driver quirks are already handled in the config, do not "fix" them:
- MSSQL's `server` is a required `string` in Lucid's types, hence the `?? 'localhost'` fallback.
- Lucid's `LibSQLConfig` types the connection as `{ filename }`, but the libsql/Turso runtime wants `url` + `authToken`. That connection carries a deliberate `as unknown as { filename: string }` with the reason in a comment.
