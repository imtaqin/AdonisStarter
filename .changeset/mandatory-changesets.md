---
'AdonisStarter': minor
---

Every task now ships a changeset, and a guard enforces it.

Changesets is wired up (`.changeset/config.json`, `npm run changeset`,
`npm run version`) for the half of the tool that applies to a private single
package: change notes and `CHANGELOG.md`. Nothing is published to npm —
`privatePackages.tag` is off and there is no publish step.

The point is not release management, it is handover. `git log` records which
lines moved; it does not record why a convention changed or what an agent must
now do differently. That is what the note carries, and it is why the rule is
"every task" rather than "significant changes" — an agent judging its own work
significant is exactly the judgement that fails silently.

So it is enforced rather than requested. `npm run changeset:check` fails when
the diff against `main` — committed or not — has no note describing it, and
`AGENTS.md` §9 puts it next to `typecheck` in the definition of done. Only
lockfile-only changes and edits inside `.changeset/` are exempt; the script and
the doc share that one list.

**Migrating:** nothing to change in existing code. New work needs
`npm run changeset` before it counts as finished.
