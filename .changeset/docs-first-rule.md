---
'AdonisStarter': minor
---

Reading the framework docs is now mandatory before writing framework code, and
the docs server ships to every agent instead of only to whoever configured it
locally.

`adonis-docs` (`npx -y mcp-adonis-docs`) is registered in
`scripts/sync-agent-configs.mjs`, so all seven generated MCP configs now carry
three servers rather than two. Previously it existed only in one developer's
personal Claude config — every other agent had no access to AdonisJS, Lucid,
Edge or VineJS documentation at all and was writing framework code from memory.

That is the actual hazard being closed. This stack is AdonisJS v7 alpha, Lucid
22 and Edge 6; a remembered API here usually belongs to the previous major, and
it fails _silently_ rather than loudly — a mistyped Edge component tag renders
as literal text, a wrong Lucid decorator simply never loads the relation.
Neither the compiler nor the test suite catches either one, so "it typechecked"
proves nothing.

New `AGENTS.md` §1a places the lookup before the tooling section and lists what
must be read before writing a model, template, validator, route, middleware, or
auth/session/shield/limiter code. It also fixes precedence: docs describe the
framework, `AGENTS.md` describes this app's deliberate deviations, and where
they disagree the repo wins — say so rather than silently following the docs.
If an API could not be confirmed, say that instead of shipping a guess.

The same rule is served machine-readable as `readDocsFirst` from the
`project_conventions` MCP tool, and `docs/AI-TOOLING.md` gains a section for the
server plus a `search_docs` step in the opening move.

**Migrating:** run `npm run agents:sync` and restart your agent so it picks up
the third MCP server.
