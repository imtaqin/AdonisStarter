import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

/*
|--------------------------------------------------------------------------
| Icon browser
|--------------------------------------------------------------------------
|
| Searchable Font Awesome Pro catalogue. Read-only and cheap, so it only needs
| authentication -- no permission gate.
|
*/

router
  .get('icons', [controllers.icon.list.Index, 'handle'])
  .as('icons.index')
  .use(middleware.auth())
