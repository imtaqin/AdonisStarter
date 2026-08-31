import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  /**
   * Default connection — driven by DB_CONNECTION env.
   * Defaults to sqlite for zero-config local dev.
   */
  connection: env.get('DB_CONNECTION', 'sqlite') as string,

  /**
   * Pretty-print SQL debug output in development logs.
   */
  prettyPrintDebugQueries: true,

  connections: {
    /**
     * SQLite — zero-config default (better-sqlite3).
     * Override file with DB_FILENAME, else tmp/db.sqlite3.
     */
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: env.get('DB_FILENAME') ?? app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },

    /**
     * PostgreSQL — set DB_CONNECTION=pg + DB_HOST/PORT/USER/PASSWORD/DATABASE
     * Requires: npm install pg
     */
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },

    /**
     * MySQL / MariaDB — set DB_CONNECTION=mysql
     * Requires: npm install mysql2
     */
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },

    /**
     * MSSQL — set DB_CONNECTION=mssql
     * Requires: npm install tedious
     */
    mssql: {
      client: 'mssql',
      connection: {
        server: env.get('DB_HOST') ?? 'localhost',
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },

    /**
     * libSQL / Turso — set DB_CONNECTION=libsql + LIBSQL_URL (+ LIBSQL_AUTH_TOKEN)
     * Requires: npm install @libsql/client @libsql/sqlite3
     * Note: Lucid types still declare `filename`; Turso runtime uses `url`.
     */
    libsql: {
      client: 'libsql',
      connection: {
        url: env.get('LIBSQL_URL'),
        authToken: env.get('LIBSQL_AUTH_TOKEN'),
      } as unknown as { filename: string },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig
