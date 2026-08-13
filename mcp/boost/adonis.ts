/*
|--------------------------------------------------------------------------
| Adonis application bootstrapper for the MCP server
|--------------------------------------------------------------------------
|
| Boots the real application in the "console" environment so tools can read the
| router, the database and the config exactly as the running app sees them --
| rather than re-parsing source files and guessing.
|
| Booting is lazy and memoised: tools that only touch the filesystem (git,
| memory, the component catalogue) never pay for it.
|
| CRITICAL: an MCP stdio server owns stdout. Anything the framework or a
| dependency writes there corrupts the JSON-RPC stream, so stdout is redirected
| to stderr for the duration of the boot.
|
*/
import type { ApplicationService } from '@adonisjs/core/types'

export const APP_ROOT = new URL('../../', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

let bootPromise: Promise<ApplicationService> | null = null

/**
 * Runs `fn` with anything written to stdout diverted to stderr.
 */
export async function withStdoutGuarded<T>(fn: () => Promise<T>): Promise<T> {
  const originalWrite = process.stdout.write.bind(process.stdout)

  process.stdout.write = ((chunk: unknown, ...rest: unknown[]) => {
    return (process.stderr.write as (...args: any[]) => boolean)(chunk, ...rest)
  }) as typeof process.stdout.write

  try {
    return await fn()
  } finally {
    process.stdout.write = originalWrite
  }
}

/**
 * Boots the application once and returns the shared instance.
 */
export async function getApp(): Promise<ApplicationService> {
  if (bootPromise) return bootPromise

  bootPromise = withStdoutGuarded(async () => {
    await import('reflect-metadata')
    const { Ignitor } = await import('@adonisjs/core')

    const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER })
    const app = ignitor.createApp('console')

    await app.init()
    await app.boot()

    /**
     * Routes live in a preload file that only the HTTP entrypoint loads, so the
     * router is empty after boot(). Import it explicitly and commit, otherwise
     * the routes tool reports nothing.
     */
    try {
      await import('#start/routes/index')
      const router = await app.container.make('router')
      router.commit()
    } catch {
      // A project without routes is unusual but not fatal for the other tools.
    }

    return app
  })

  return bootPromise
}

/** Values that must never leave the machine through a tool response. */
const SECRET_PATTERN = /(key|secret|token|password|passwd|pwd|credential|dsn|auth|salt|hash)/i

export function redact(value: unknown, keyPath = ''): unknown {
  if (SECRET_PATTERN.test(keyPath)) return '[redacted]'

  if (Array.isArray(value)) return value.map((item, index) => redact(item, `${keyPath}[${index}]`))

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      out[key] = redact(item, key)
    }
    return out
  }

  return value
}
