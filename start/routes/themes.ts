import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import { mutationThrottle } from '#start/limiter'

/*
|--------------------------------------------------------------------------
| Appearance
|--------------------------------------------------------------------------
|
| Picking a dashboard theme. Authentication only, no permission gate: the
| setting belongs to the signed-in user and changes nothing anyone else sees.
|
| GET serves the picker, POST accepts it -- no PUT/PATCH anywhere in this app.
|
*/

router
  .group(() => {
    router.get('appearance', [controllers.theme.index.Index, 'show']).as('themes.show')
    router
      .post('appearance', [controllers.theme.index.Index, 'handle'])
      .as('themes.update')
      .use(mutationThrottle)
  })
  .prefix('settings')
  .use([middleware.auth(), middleware.noCache()])
