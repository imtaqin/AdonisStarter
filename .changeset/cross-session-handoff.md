---
'AdonisStarter': minor
---

Adds `session_handoff`, so unfinished work survives the end of a session and
crosses from one agent to another.

The shared-context half of this was already built: `.agent/memory/` is committed,
and all seven MCP configs point every agent — Claude, Cursor, Gemini, Kimi,
Cline, Copilot, Aider, Windsurf, opencode — at the same `adonis-boost` server.
What was missing is the part that matters when a session actually ends. Durable
decisions had `memory_write`; work *in flight* had nowhere to go, so it lived in
one chat history and died with it. `AGENTS.md` §10 already told agents to keep a
`kind: todo` ledger for document-folder work, but nothing enforced a slug, so a
second agent had no name to look for — and in practice no ledger was ever
written.

`session_handoff` writes one baton at a fixed slug, `.agent/memory/session-handoff.md`:
the task in the requester's own words, what is done **and how it was verified**,
what is next in order, and the dead ends already tried. `done_all: true` clears
it. One handoff exists at a time — a discoverable name beats a searchable one,
and one baton is a queue while several are an argument.

Discovery is push, not pull. `memory_list` now answers `resuming: true` and lifts
the open handoff above the note list with the exact call to make next, so an
agent that runs the standard opening move cannot scroll past it. The MCP server's
own `instructions` — which every client shows on connect — now open with "START
HERE" and close with "END HERE", naming both halves.

`project_conventions` had also drifted behind the last change: it still listed
five gotchas without the silent-icon rule, described branding as
`config/dashboard.ts` with no mention that templates must read the `brandLogos`
global, and said nothing about `DB_CONNECTION`, the auth boundary, or the
nine-site showcase cleanup. Those are the rules agents get *machine-readable*
rather than by reading prose, so they now carry `crossSession`, `database` and
`showcaseBoundary` blocks alongside the corrected gotchas.

Verified by driving the real server over stdio as a client: agent A starts clean
(`resuming: false`), writes a handoff, agent B cold-starts and sees
`resuming: true` with the baton readable as `kind: todo`, clears it, and a third
start reads clean again.

**Migrating:** nothing breaks. Restart your agent so it picks up the new tool and
the updated server instructions. If you stop mid-task, call `session_handoff`
before you go; if you finish, call it with `done_all: true` — a stale baton read
as live work by the next agent is worse than no baton at all.
