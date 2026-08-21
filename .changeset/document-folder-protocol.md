---
'AdonisStarter': minor
---

Adds a protocol for the case where an agent is pointed at a folder of specs or
markdown and told to implement it.

The failure this prevents is not bad code, it is lost work. An agent reads
twenty files, its context fills, the original request falls out of it, and it
finishes something adjacent to what was asked — confidently, with no error to
signal the drift. Context is not durable storage, and treating it as though it
were is the actual bug.

So the task gets written down outside the context window. New `AGENTS.md` §10
requires indexing the folder before reading it (titles and headings only, never
a bulk read), then a `memory_write` note of kind `todo` — the request in one
sentence in the requester's own words, the files in scope, a checklist, and an
Open questions list — written *before* any code. Work proceeds one item at a
time, ticking the box after each. If the agent is interrupted or compacted,
`memory_list` recovers the whole task instead of only what survived.

Two rules ride along because a document folder is where they get broken.
Specs are reconciled, not transcribed: where a document contradicts §1, §1a or
§3, the repo wins and the conflict is recorded rather than silently resolved —
a spec that predates a convention is not permission to break it. And scope is
never narrowed silently: a `[skip: why]` line is honest, a checklist quietly
missing three files is not.

The ledger is deleted once every box is ticked, since a stale `todo` note read
as live work by the next agent is worse than no note at all.

Served machine-readable as `workingFromADocumentFolder` from the
`project_conventions` MCP tool.

**Migrating:** nothing to change. Applies to new work handed a document folder.
