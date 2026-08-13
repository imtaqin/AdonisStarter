import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import { mutationThrottle } from '#start/limiter'

/*
|--------------------------------------------------------------------------
| Users
|--------------------------------------------------------------------------
|
| GET and POST only -- no PUT/PATCH/DELETE anywhere in this app. A form URL
| serves the form on GET and accepts the submission on POST, and destructive
| actions get their own explicit `/delete` endpoint.
|
| Read and write are gated separately: `users.view` to see the list, and
| `users.manage` to change anything. Applying one permission to the whole group
| would let every viewer edit (OWASP A01).
|
*/

router
  .group(() => {
    router
      .get('/', [controllers.user.list.Index, 'handle'])
      .as('users.index')
      .use(middleware.permission({ permission: 'users.view' }))

    router
      .group(() => {
        router.get('create', [controllers.user.create.Index, 'show']).as('users.create')
        router.post('create', [controllers.user.create.Index, 'handle']).as('users.store')

        router.get(':id/edit', [controllers.user.update.Index, 'show']).as('users.edit')
        router.post(':id/edit', [controllers.user.update.Index, 'handle']).as('users.update')

        /**
         * POST rather than GET: a destructive action must never be reachable
         * by following a link, a prefetch, or an <img> tag.
         */
        router.post(':id/delete', [controllers.user.delete.Index, 'handle']).as('users.destroy')
      })
      .where('id', router.matchers.number())
      .use([middleware.permission({ permission: 'users.manage' }), mutationThrottle])
  })
  .prefix('users')
  .use([middleware.auth(), middleware.noCache()])
