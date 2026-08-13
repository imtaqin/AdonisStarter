import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import { mutationThrottle } from '#start/limiter'

/*
|--------------------------------------------------------------------------
| Roles and permissions
|--------------------------------------------------------------------------
|
| GET and POST only, same shape as start/routes/users.ts.
|
| Editing roles is privilege escalation by definition, so `roles.manage` should
| be granted to administrators only.
|
*/

router
  .group(() => {
    router
      .get('/', [controllers.role.list.Index, 'handle'])
      .as('roles.index')
      .use(middleware.permission({ permission: 'roles.view' }))

    router
      .group(() => {
        router.get('create', [controllers.role.create.Index, 'show']).as('roles.create')
        router.post('create', [controllers.role.create.Index, 'handle']).as('roles.store')

        router.get(':id/edit', [controllers.role.update.Index, 'show']).as('roles.edit')
        router.post(':id/edit', [controllers.role.update.Index, 'handle']).as('roles.update')

        router.post(':id/delete', [controllers.role.delete.Index, 'handle']).as('roles.destroy')
      })
      .where('id', router.matchers.number())
      .use([middleware.permission({ permission: 'roles.manage' }), mutationThrottle])
  })
  .prefix('roles')
  .use([middleware.auth(), middleware.noCache()])
