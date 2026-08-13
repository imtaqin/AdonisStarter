import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'
import { loginThrottle, signupThrottle } from '#start/limiter'

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| The POST routes are rate limited (see start/limiter.ts) to blunt credential
| stuffing and automated signup abuse.
|
*/

router
  .group(() => {
    router.get('login', [controllers.auth.login.Index, 'show']).as('auth.login.show')
    router
      .post('login', [controllers.auth.login.Index, 'handle'])
      .as('auth.login.store')
      .use(loginThrottle)

    router.get('signup', [controllers.auth.register.Index, 'show']).as('auth.register.show')
    router
      .post('signup', [controllers.auth.register.Index, 'handle'])
      .as('auth.register.store')
      .use(signupThrottle)
  })
  .use(middleware.guest())

/**
 * Logout is POST-only so a stray <img src="/logout"> cannot sign users out,
 * and it is CSRF protected like every other mutating route.
 */
router
  .post('logout', [controllers.auth.logout.Index, 'handle'])
  .as('auth.logout')
  .use(middleware.auth())
