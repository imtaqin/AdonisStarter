# Changesets

This scaffold is a single **private** package, so Changesets is used only for the
half of the tool that applies here: recording intent-level change notes and
turning them into `CHANGELOG.md` plus a version bump. Nothing is ever published
to npm — there is no `changeset publish` step, and `privatePackages.tag` is off.

Why bother on a private repo: the useful history here is _what convention
changed and why an agent must now do it differently_, which a commit log buries.
A changeset says it once, in the release notes, where the next agent reads it.

Add one whenever you change something a consumer of the scaffold would have to
react to — a convention in `AGENTS.md`, a controller/route layout rule, a
security default, an MCP tool contract:

    npm run changeset

Skip it for typos, formatting, and internal refactors that leave every
documented rule intact.

Cut a release when changesets have piled up:

    npm run version    # consumes .changeset/*.md -> CHANGELOG.md + package.json

Semver, as it maps to a scaffold:

| Bump    | Means                                                          |
| ------- | -------------------------------------------------------------- |
| `major` | a rule changed such that existing code is now wrong            |
| `minor` | new capability — a component, MCP tool, middleware, convention |
| `patch` | a fix or clarification that breaks nothing                     |

Full docs: https://changesets.dev
