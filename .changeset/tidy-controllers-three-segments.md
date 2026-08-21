---
'AdonisStarter': major
---

Controllers now always live at `app/controllers/<Domain>/<Action>/index.ts` —
three segments, no exceptions.

The two-segment form is gone. A domain with a single screen gets an action
folder named `Index` (`Dashboard/Index/index.ts`), never `Dashboard/index.ts`.
`Dashboard` and `Showcase` were the two controllers in this scaffold still using
the flat form and have been moved; their route references became
`controllers.dashboard.index.Index` and `controllers.showcase.index.Index`.

This was a documentation bug before it was a code bug. `AGENTS.md` §3 said "one
action group per folder" but its own example table listed
`app/controllers/Dashboard/index.ts` as valid, so agents reasonably produced the
flat form — and the scaffold contradicted its own rule. §3 has been rewritten
with a binding action vocabulary (`List` / `Create` / `Update` / `Delete` /
`Show` / `Index`), the method each one exposes, and the naming trap that catches
agents most often: the route is named `users.edit` while the controller folder
is `User/Update`, because the folder is named after the mutation, not the URL.
`Api/` is documented as the only other permitted top-level prefix, mirroring the
same shape.

The same rules are now served machine-readable from the `project_conventions`
MCP tool as a `controllerLayout` block, which is what agents actually read first.

**Migrating:** any controller at `app/controllers/<Domain>/index.ts` must move to
`app/controllers/<Domain>/Index/index.ts`, and its route reference gains an
`.index` segment. Boot the app once afterwards so `#generated/controllers`
regenerates.
