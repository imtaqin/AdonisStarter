import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router
  .get('/', [controllers.dashboard.index.Index, 'handle'])
  .as('dashboard')
  .use([middleware.auth(), middleware.noCache()])
