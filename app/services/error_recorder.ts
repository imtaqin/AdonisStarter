import fs from 'node:fs'
import path from 'node:path'
import app from '@adonisjs/core/services/app'

/**
 * Append-only ring of the most recent unhandled exceptions, written to
 * `tmp/errors.jsonl`.
 *
 * The framework prints errors to the terminal, which an AI agent driving the
 * project cannot see. Persisting them gives the `last_errors` MCP tool
 * something real to read, so "the page 500s" becomes a stack trace instead of a
 * guessing game.
 *
 * Disabled in production: this is a development aid, and an error log written
 * to the application directory is not something to ship.
 */
const MAX_ENTRIES = 50

export default class ErrorRecorder {
  static get filePath() {
    return app.tmpPath('errors.jsonl')
  }

  static record(error: unknown, context?: { method?: string; url?: string; requestId?: string }) {
    if (app.inProduction) return

    try {
      const entry = {
        at: new Date().toISOString(),
        name: (error as Error)?.name ?? 'Error',
        message: (error as Error)?.message ?? String(error),
        status: (error as any)?.status ?? (error as any)?.statusCode ?? null,
        code: (error as any)?.code ?? null,
        request: context ?? null,
        /** Frames from the project only — framework internals are noise here. */
        stack: ((error as Error)?.stack ?? '')
          .split('\n')
          .slice(0, 25)
          .map((line) => line.trim())
          .filter((line) => line.startsWith('at '))
          .slice(0, 12),
      }

      const file = ErrorRecorder.filePath
      fs.mkdirSync(path.dirname(file), { recursive: true })

      const existing = fs.existsSync(file)
        ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
        : []

      existing.push(JSON.stringify(entry))

      fs.writeFileSync(file, existing.slice(-MAX_ENTRIES).join('\n') + '\n')
    } catch {
      // Never let the recorder itself break request handling.
    }
  }
}
