import { Env } from '@adonisjs/core/env'

/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.string(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  /*
  |----------------------------------------------------------
  | Database — multi-driver via DB_CONNECTION
  |----------------------------------------------------------
  |
  | DB_CONNECTION picks the default Lucid connection.
  | sqlite = zero-config (default, file: tmp/db.sqlite3 or DB_FILENAME)
  | pg | mysql | mssql = set DB_HOST/PORT/USER/PASSWORD/DATABASE
  | libsql (Turso)     = set LIBSQL_URL (+ LIBSQL_AUTH_TOKEN)
  |
  */
  DB_CONNECTION: Env.schema.enum.optional(['sqlite', 'pg', 'mysql', 'mssql', 'libsql'] as const),
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),
  DB_FILENAME: Env.schema.string.optional(),
  LIBSQL_URL: Env.schema.string.optional(),
  LIBSQL_AUTH_TOKEN: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Seeded administrator account
  |----------------------------------------------------------
  |
  | Used by database/seeders/main_seeder.ts on a fresh install only; the seeder
  | never resets the password of an account that already exists. Change these
  | before seeding anything you intend to expose.
  |
  */
  ADMIN_EMAIL: Env.schema.string.optional({ format: 'email' }),
  ADMIN_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Local scaffolding shortcut
  |----------------------------------------------------------
  |
  | When true, every request is signed in as the seeded administrator so the
  | dashboard can be browsed without logging in. Refuses to run in production
  | (see app/middleware/dev_auto_login_middleware.ts). Never set this on a
  | deployed environment.
  |
  */
  AUTH_BYPASS: Env.schema.boolean.optional(),
})
