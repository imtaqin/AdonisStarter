import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

/*
|--------------------------------------------------------------------------
| Audit log
|--------------------------------------------------------------------------
|
| Read-only by design. The trail is append-only -- there is deliberately no
| route to edit or delete entries, because an attacker who can erase the log
| can erase the evidence (OWASP A09).
|
*/

router
  .get('audit-logs', [controllers.auditLog.list.Index, 'handle'])
  .as('audit_logs.index')
  .use([
    middleware.auth(),
    middleware.noCache(),
    middleware.permission({ permission: 'audit.view' }),
  ])
