import { z } from 'zod'
import fs from 'node:fs'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { APP_ROOT, getApp, withStdoutGuarded } from '../adonis.js'
import { failure, text } from '../reply.js'

export function registerDebugTools(server: McpServer) {
  server.registerTool(
    'last_errors',
    {
      title: 'Last application errors',
      description:
        'The most recent unhandled exceptions with their stack traces, recorded by app/services/error_recorder.ts. Call this the moment a page 500s instead of guessing from the browser.',
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe('How many, newest first (default 5)'),
      },
    },
    async ({ limit }) => {
      const file = new URL('tmp/errors.jsonl', APP_ROOT)

      if (!fs.existsSync(file)) {
        return text({
          errors: [],
          note: 'No errors recorded yet. The recorder writes tmp/errors.jsonl on the first unhandled exception (development only).',
        })
      }

      const entries = fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        })
        .filter(Boolean)
        .reverse()
        .slice(0, limit ?? 5)

      return text({ total: entries.length, errors: entries })
    }
  )

  server.registerTool(
    'clear_errors',
    {
      title: 'Clear the error log',
      description:
        'Empties tmp/errors.jsonl. Do this before reproducing a bug so `last_errors` shows only what your reproduction produced.',
      inputSchema: {},
    },
    async () => {
      const file = new URL('tmp/errors.jsonl', APP_ROOT)
      if (fs.existsSync(file)) fs.rmSync(file)
      return text({ cleared: true })
    }
  )

  server.registerTool(
    'tail_log',
    {
      title: 'Tail a log file',
      description:
        'Reads the end of a log file under tmp/. Useful when the dev server has been told to log to a file.',
      inputSchema: {
        file: z.string().optional().describe('Path relative to tmp/, default "app.log"'),
        lines: z.number().int().min(1).max(500).optional().describe('Default 80'),
      },
    },
    async ({ file, lines }) => {
      const name = (file ?? 'app.log').replace(/^[/\\]+/, '')

      // Keep the tool inside tmp/ — it must not become an arbitrary file reader.
      if (name.includes('..')) return failure('Path traversal is not allowed.')

      const target = new URL(`tmp/${name}`, APP_ROOT)
      if (!fs.existsSync(target)) {
        return text({ note: `tmp/${name} does not exist.`, lines: [] })
      }

      const content = fs.readFileSync(target, 'utf8').split('\n').filter(Boolean)
      return text({ file: `tmp/${name}`, lines: content.slice(-(lines ?? 80)) })
    }
  )

  server.registerTool(
    'eval',
    {
      title: 'Evaluate code in the application context',
      description:
        'Runs JavaScript inside the booted app — the Tinker equivalent. Import models with `await import("#models/user")`. The value of the last expression is returned. Read-only inspection is the intended use; it CAN write, so do not run destructive code without being asked.',
      inputSchema: {
        code: z
          .string()
          .describe(
            'JavaScript body. Use `return` to send a value back, e.g. `const User = (await import("#models/user")).default; return await User.all()`'
          ),
      },
    },
    async ({ code }) => {
      const app = await getApp()

      if (app.inProduction) {
        return failure('eval is disabled in production.')
      }

      try {
        const result = await withStdoutGuarded(async () => {
          const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
          const fn = new AsyncFunction('app', code)
          return fn(app)
        })

        return text({
          result:
            result === undefined
              ? '(undefined — did you forget to `return`?)'
              : JSON.parse(
                  JSON.stringify(result, (_key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                  )
                ),
        })
      } catch (error) {
        return failure('Evaluation failed', {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack?.split('\n').slice(0, 8),
        })
      }
    }
  )
}
