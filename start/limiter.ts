/*
|--------------------------------------------------------------------------
| HTTP rate limiters
|--------------------------------------------------------------------------
|
| Mitigates OWASP A07 (identification and authentication failures) by making
| credential stuffing and brute force expensive, and A04 (insecure design) by
| putting a ceiling on request volume.
|
| Attach these to routes in start/routes/*.ts with `.use(loginThrottle)`.
|
*/

import limiter from '@adonisjs/limiter/services/main'

/**
 * Baseline ceiling for authenticated application traffic. Generous enough that
 * a person clicking around never notices it.
 */
export const globalThrottle = limiter.define('global', () => {
  return limiter.allowRequests(120).every('1 minute')
})

/**
 * Login attempts, keyed by IP *and* submitted email so that one attacker cannot
 * lock out a legitimate user by hammering their address from elsewhere.
 *
 * `limitExceeded` returns a generic message: telling the client how long to
 * wait is fine, telling them whether the account exists is not.
 */
export const loginThrottle = limiter.define('login', (ctx) => {
  const email = String(ctx.request.input('email', '')).toLowerCase().trim()

  return limiter
    .allowRequests(5)
    .every('15 minutes')
    .usingKey(`login_${ctx.request.ip()}_${email}`)
    .limitExceeded((error) => {
      error.setMessage('Too many login attempts. Please try again later.').setStatus(429)
    })
})

/**
 * Registration, keyed by IP only -- there is no account to key against yet.
 */
export const signupThrottle = limiter.define('signup', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('1 hour')
    .usingKey(`signup_${ctx.request.ip()}`)
    .limitExceeded((error) => {
      error.setMessage('Too many accounts created from this address.').setStatus(429)
    })
})

/**
 * Writes to administrative resources. Bounds the blast radius of a stolen
 * session before anyone notices it.
 */
export const mutationThrottle = limiter.define('mutation', (ctx) => {
  return limiter
    .allowRequests(60)
    .every('1 minute')
    .usingKey(`mutation_${ctx.auth?.user?.id ?? ctx.request.ip()}`)
})
