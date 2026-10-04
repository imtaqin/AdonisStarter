import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

/*
|--------------------------------------------------------------------------
| Velzon catalogue
|--------------------------------------------------------------------------
|
| 167 converted Velzon template pages, served as reference markup. Read-only,
| so authentication is the only gate.
|
| `:page` is constrained to a slug here and checked against a generated
| allowlist in the controller -- the route matcher alone is not the security
| boundary.
|
*/

router
  .group(() => {
    router.get('/', [controllers.velzon.list.Index, 'handle']).as('velzon.index')
    router
      .get(':page', [controllers.velzon.show.Index, 'handle'])
      .as('velzon.show')
      .where('page', /^[a-z0-9-]+$/)
  })
  .prefix('velzon')
  .use(middleware.auth())
