# AI agent tooling

This repo is set up so any mainstream coding agent gets the same context, the
same rules, and the same project-aware tools. Nothing here is Claude-specific.

---

## 1. One source of truth

`AGENTS.md` holds the conventions. Everything else is a generated pointer:

```bash
npm run agents:sync     # regenerate all agent config files
npm run agents:check    # CI: fail if any file is stale
```

`scripts/sync-agent-configs.mjs` writes these. **Never edit them by hand** —
edit `AGENTS.md` (or the script) and re-run.

| Agent                            | Context file                      | MCP config                                     |
| -------------------------------- | --------------------------------- | ---------------------------------------------- |
| Codex, Factory, Ona, Devin, Warp | `AGENTS.md` (native)              | —                                              |
| Claude Code                      | `CLAUDE.md`                       | `.mcp.json`                                    |
| Cursor                           | `.cursor/rules/project.mdc`       | `.cursor/mcp.json`                             |
| Crush                            | `CRUSH.md`                        | `.crush.json` (key is `mcp`, not `mcpServers`) |
| Kimi Code                        | `.kimi-code/AGENTS.md`            | `.kimi-code/mcp.json`                          |
| Gemini CLI                       | `GEMINI.md`                       | `.gemini/settings.json`                        |
| GitHub Copilot                   | `.github/copilot-instructions.md` | `.vscode/mcp.json`                             |
| Windsurf                         | `.windsurf/rules/project.md`      | —                                              |
| Cline                            | `.clinerules`                     | —                                              |
| Aider                            | `CONVENTIONS.md`                  | —                                              |
| opencode                         | `AGENTS.md` (native)              | `opencode.json`                                |

To support another agent, add one entry to `CONTEXT_TARGETS` or `MCP_TARGETS`
in the script. No new prose gets written.

---

## 2. Adonis Boost — the project-aware MCP server

The equivalent of Laravel Boost for this app. It **boots the real application**,
so its answers reflect what the framework actually loaded rather than what the
source files appear to say.

```bash
npm run mcp           # run it directly (stdio)
npm run mcp:inspect   # open the MCP Inspector UI against it
```

### Tools

**Understanding the app**

| Tool                  | Use it for                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| `application_info`    | Versions, package list, counts. The cheapest orientation call.             |
| `list_routes`         | Every route with its middleware. Beats reading `start/routes/*.ts`.        |
| `read_config`         | A resolved config value by dotted key. Secrets are redacted.               |
| `list_commands`       | Available `node ace` commands.                                             |
| `project_conventions` | The non-obvious rules, permission slugs, and the recipe for adding a page. |

**Data**

| Tool              | Use it for                                                                             |
| ----------------- | -------------------------------------------------------------------------------------- |
| `database_schema` | Live table and column definitions — the source `database/schema.ts` is generated from. |
| `database_query`  | A single read-only `SELECT`. Writes and DDL are refused.                               |
| `list_models`     | Models with their columns and relationships.                                           |

**Views**

| Tool              | Use it for                                                                 |
| ----------------- | -------------------------------------------------------------------------- |
| `list_components` | Every Edge component **with the exact tag name** and its documented props. |
| `list_views`      | Page templates with the name to pass to `view.render()`.                   |

`list_components` matters more than it looks: Edge camelCases tag names from the
file path, and a wrong tag renders as literal text on the page instead of
raising an error. Ask the tool rather than guessing.

**Icons**

| Tool           | Use it for                                                   |
| -------------- | ------------------------------------------------------------ |
| `search_icons` | Find a Font Awesome icon by meaning and get the exact class. |
| `icon_styles`  | Which families are vendored and how to write the classes.    |

This exists because Font Awesome has no error state for an unknown icon — a
typo renders as blank space that nobody notices until review. Searching costs
one call and removes the guess:

```
search_icons { query: "invoice" }   → fa-solid fa-file-invoice
search_icons { query: "user settings" } → fa-solid fa-user-gear
search_icons { query: "github", style: "brands" } → fa-brands fa-github
```

The index is built from Font Awesome's own metadata (4,318 icons with their
synonyms), reduced from 36MB to 0.8MB by `npm run theme:fontawesome`.

**Debugging**

| Tool           | Use it for                                              |
| -------------- | ------------------------------------------------------- |
| `last_errors`  | Stack traces from recent unhandled exceptions.          |
| `clear_errors` | Empty the log before reproducing a bug.                 |
| `tail_log`     | Read the end of a file under `tmp/`.                    |
| `eval`         | Run code inside the booted app — the Tinker equivalent. |

Errors are captured by `app/services/error_recorder.ts`, wired into the
exception handler, and written to `tmp/errors.jsonl` (development only, capped
at 50 entries). This exists because **an agent cannot see your terminal** — when
a page 500s, `last_errors` turns "it broke" into a stack trace.

```
clear_errors → reproduce the bug → last_errors
```

`eval` runs arbitrary code in app context:

```js
const User = (await import('#models/user')).default
return (await User.query().preload('roles')).map((u) => u.email)
```

It is disabled in production, but it _can_ write in development. Do not run
destructive code without being asked.

**Memory**

| Tool                            | Use it for                                                |
| ------------------------------- | --------------------------------------------------------- |
| `memory_list`                   | Everything remembered. Call it at the start of a session. |
| `memory_read` / `memory_search` | Retrieve one note, or search all of them.                 |
| `memory_write`                  | Record a decision, gotcha or preference.                  |
| `memory_delete`                 | Remove a note that turned out to be wrong.                |

**Git as context**

| Tool                 | Use it for                                             |
| -------------------- | ------------------------------------------------------ |
| `git_status`         | Branch and working tree state.                         |
| `git_recent_commits` | What has been happening, with the files touched.       |
| `git_search_history` | Pickaxe search: when did this string appear, and why?  |
| `git_diff`           | Working tree, staged, or a commit/range.               |
| `git_conventions`    | The commit style actually in use, plus churn hotspots. |
| `git_file_context`   | History and authorship of one file.                    |

All git tools degrade gracefully on a repository with no commits yet.

---

## 3. Persistent memory

Notes live in `.agent/memory/` as markdown with frontmatter, one file per note,
plus a generated `INDEX.md`. They are **committed to the repository** on
purpose: memory that only exists on one machine is not shared context, and a
note that changes behaviour deserves review in a diff like anything else.

```markdown
---
title: Theme assets live in public/theme, not public/assets
kind: gotcha
tags: assets, vite
updated: 2026-08-06
---

`config/vite.ts` sets `buildDirectory: 'public/assets'` and `vite build` empties
that directory, which would delete the vendor theme.
```

**What belongs here:** decisions and the reason behind them, dead ends worth not
repeating, environment quirks, user preferences.

**What does not:** anything the code, the type system or git history already
tells you. If a note would go stale the moment someone refactors, it is not
memory — it is a comment in the wrong place.

Always write the _why_. "We use GET/POST only because the team standardised on
it" survives; "no PUT" does not explain itself six weeks later.

---

## 4. A good opening move

```
memory_list           → what was already decided
project_conventions   → the rules that break silently
git_status            → what the working tree looks like
```

Three calls, a few hundred tokens, and the agent is oriented. That is the whole
point of this setup: cheaper and more reliable than reading twenty files and
inferring.
