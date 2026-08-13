import { z } from 'zod'
import fs from 'node:fs'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { APP_ROOT, getApp, redact, withStdoutGuarded } from '../adonis.js'
import { text } from '../reply.js'

/**
 * Tools that answer "what is this application?" — the questions an agent
 * otherwise burns several file reads guessing at.
 */
export function registerApplicationTools(server: McpServer) {
  server.registerTool(
    'application_info',
    {
      title: 'Application info',
      description:
        'Framework and package versions, the configured database, and the counts of routes, models, controllers and Edge components. Call this first when you are new to the project.',
      inputSchema: {},
    },
    async () => {
      const pkg = JSON.parse(fs.readFileSync(new URL('package.json', APP_ROOT), 'utf8'))

      const countFiles = (dir: string, extension: string): number => {
        const target = new URL(dir, APP_ROOT)
        if (!fs.existsSync(target)) return 0
        let total = 0
        for (const entry of fs.readdirSync(target, { withFileTypes: true, recursive: true })) {
          if (entry.isFile() && entry.name.endsWith(extension)) total++
        }
        return total
      }

      const app = await getApp()
      const router = await app.container.make('router')

      return text({
        name: pkg.name,
        node: process.version,
        adonisVersion: pkg.dependencies?.['@adonisjs/core'],
        packages: {
          ...pkg.dependencies,
        },
        database: process.env.DB_CONNECTION ?? 'sqlite (see config/database.ts)',
        counts: {
          routes: router.toJSON()?.root?.length ?? 0,
          controllers: countFiles('app/controllers/', '.ts'),
          models: countFiles('app/models/', '.ts'),
          services: countFiles('app/services/', '.ts'),
          middleware: countFiles('app/middleware/', '.ts'),
          edgeComponents: countFiles('resources/views/components/', '.edge'),
          showcasePages: countFiles('resources/views/pages/showcase/', '.edge'),
        },
        conventions:
          'Read AGENTS.md before writing code — it documents four non-obvious framework rules.',
      })
    }
  )

  server.registerTool(
    'list_routes',
    {
      title: 'List routes',
      description:
        'Every registered route with its method, pattern, name, controller and middleware. Use it instead of reading start/routes/*.ts when you need to know what exists or which middleware guards a path.',
      inputSchema: {
        filter: z
          .string()
          .optional()
          .describe('Case-insensitive substring matched against the pattern, name or handler'),
      },
    },
    async ({ filter }) => {
      const app = await getApp()
      const router = await app.container.make('router')

      const routes = router.toJSON()?.root ?? []
      const rows = routes.map((route: any) => ({
        methods: route.methods?.join('|'),
        pattern: route.pattern,
        name: route.name ?? null,
        handler:
          typeof route.handler === 'object' && route.handler?.reference
            ? String(route.handler.reference)
            : 'closure',
        middleware: (route.middleware?.all?.() ? [...route.middleware.all()] : [])
          .map((entry: any) => entry?.name ?? entry?.args?.[0] ?? 'middleware')
          .filter(Boolean),
      }))

      const needle = filter?.toLowerCase()
      const filtered = needle
        ? rows.filter((row: any) =>
            [row.pattern, row.name, row.handler].some((value) =>
              String(value ?? '')
                .toLowerCase()
                .includes(needle)
            )
          )
        : rows

      return text({ total: filtered.length, routes: filtered })
    }
  )

  server.registerTool(
    'read_config',
    {
      title: 'Read config',
      description:
        'Resolved configuration value by dotted key, e.g. "database.connection" or "app.http". Secrets are redacted. Reflects what the app actually loaded, including env overrides.',
      inputSchema: {
        key: z
          .string()
          .optional()
          .describe('Dotted config key. Omit to list the available top-level namespaces.'),
      },
    },
    async ({ key }) => {
      const app = await getApp()
      const config = await app.container.make('config')

      if (!key) {
        return text({
          hint: 'Pass a dotted key, e.g. "database.connection".',
          namespaces: Object.keys(config.all() as Record<string, unknown>),
        })
      }

      return text({ key, value: redact(config.get(key), key) })
    }
  )

  server.registerTool(
    'list_commands',
    {
      title: 'List ace commands',
      description: 'Available `node ace` commands with their descriptions.',
      inputSchema: {},
    },
    async () => {
      const app = await getApp()

      const commands = await withStdoutGuarded(async () => {
        const ace = await app.container.make('ace')
        await ace.boot()
        return ace.getCommands().map((command: any) => ({
          name: command.commandName,
          description: command.description,
        }))
      })

      return text({ total: commands.length, commands })
    }
  )
}
