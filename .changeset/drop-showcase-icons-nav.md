---
'AdonisStarter': patch
---

Drops the "Icons" entry that pointed at `/showcase/icons` from the sidebar.

It was redundant once `/icons` shipped. The showcase page lists the six icon
sets that came with the template and no Font Awesome at all, so having both in
the nav pointed agents and users at the set this project does *not* use.

The page itself is untouched and still reachable at `/showcase/icons` like every
other template reference page — only the nav entry is gone.

**Migrating:** nothing. `/icons` is the Font Awesome browser and remains in the
sidebar.
