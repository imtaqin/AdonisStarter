---
title: One shared context: how work crosses sessions and agents
kind: decision
tags: memory, handoff, mcp, conventions
updated: 2026-08-31
---
`.agent/memory/` is the single shared context for every agent wired to this repo — Claude, Cursor, Gemini, Kimi, Cline, Copilot, Aider, Windsurf, opencode. All seven MCP configs point at the same `adonis-boost` server, and the notes are **committed**, so context crosses tools, machines and days. Memory that lives only in one chat history is not context.

**Two kinds, do not mix them:**
- `memory_write` — what outlives the task: decisions, gotchas, preferences. Always with the *why*.
- `session_handoff` — the task still in flight. One baton at a time, fixed slug `session-handoff`.

**The protocol:**
1. **Start:** `memory_list`. If it answers `resuming: true`, an earlier session left work unfinished — `memory_read("session-handoff")` and continue it. Do not start over, and do not redo what it lists as verified.
2. **Stop mid-task:** `session_handoff` with the goal in the requester's own words, what is done *and how you verified it*, what is next in order, and the dead ends already tried. What is not in the handoff did not happen.
3. **Finish:** `session_handoff` with `done_all: true`. A stale baton read as live work by the next agent is worse than no baton.

**Why a fixed slug:** a discoverable name beats a searchable one. AGENTS.md §10 previously asked for a `kind: todo` ledger but pinned no slug, so a second agent had no name to look for and in practice no ledger was ever written.

**Why memory_list pushes it:** discovery cannot depend on an agent choosing to search. The open handoff is lifted above the note list with the exact next call, so the standard opening move surfaces it whether or not the agent was looking.

Write `done` as verified facts, not intentions — "login renders, checked in browser: 200, fields present, 0 broken images" is a handoff; "fixed login" is a guess the next agent must re-verify from scratch.
