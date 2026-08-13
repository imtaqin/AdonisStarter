import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

/*
|--------------------------------------------------------------------------
| Template reference pages
|--------------------------------------------------------------------------
|
| The converted Imtaqin pages, kept behind auth so an unfinished project does
| not publish a browsable copy of the theme.
|
| Delete this file and resources/views/pages/showcase once you no longer need
| the component catalogue.
|
*/

router
  .get('showcase/:page', [controllers.showcase.Index, 'handle'])
  .as('showcase')
  .where('page', /^[a-z0-9-]+$/)
  .use(middleware.auth())
