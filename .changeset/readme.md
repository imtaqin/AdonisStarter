---
'AdonisStarter': patch
---

Adds a `README.md`. The repo had none, so anyone opening it on GitHub landed on
a file listing with no explanation.

It covers the stack, what ships in the box, first-run setup (install, key,
migrate, seed, dev), the seeded admin credentials and `AUTH_BYPASS`, the three
MCP servers every generated agent config wires up, and the day-to-day commands.
It also documents the `npm rebuild better-sqlite3` fix for the
`NODE_MODULE_VERSION` 500 you get after upgrading Node, and states that the
vendored Font Awesome Pro assets are licensed to the owner and must not be
redistributed.

Author credit to [Imtaqin](https://imtaqin.id) appears at the top and bottom.

**Migrating:** nothing.
