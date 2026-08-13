/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| One file per domain, registered here in order. Import order matters only for
| the catch-all at the bottom.
|
| Conventions used across these files:
|   - Every route is named. config/menu.ts resolves sidebar entries through
|     `route(...)`, so renaming a route means updating the menu too.
|   - Every non-guest route sits inside the `auth` group.
|   - Screens that expose or mutate administrative data carry an explicit
|     `permission` middleware. Authentication is not authorization.
|
*/

import './auth.js'
import './dashboard.js'
import './showcase.js'
import './icons.js'
import './users.js'
import './roles.js'
import './audit_logs.js'
