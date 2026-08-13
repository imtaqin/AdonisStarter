import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getApp } from '../adonis.js'
import { failure, text } from '../reply.js'

/**
 * Statements that may never run through the query tool.
 *
 * The check runs AFTER comments are stripped: a block comment followed by
 * "DROP TABLE" would otherwise hide the keyword from this pattern while the
 * database still executed it.
 */
const FORBIDDEN =
  /\b(insert|update|delete|drop|alter|truncate|create|replace|attach|detach|pragma|vacuum|grant|revoke)\b/i

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .trim()
}

export function registerDatabaseTools(server: McpServer) {
  server.registerTool(
    'database_schema',
    {
      title: 'Database schema',
      description:
        'Tables with their columns, types and nullability, read live from the database. This is the source of truth — database/schema.ts is generated from it.',
      inputSchema: {
        table: z.string().optional().describe('Limit the output to one table'),
      },
    },
    async ({ table }) => {
      const app = await getApp()
      const db = await app.container.make('lucid.db')

      const tables: string[] = table ? [table] : await db.connection().getAllTables()

      const schema = []
      for (const name of tables) {
        const columns = await db.connection().columnsInfo(name)
        schema.push({
          table: name,
          columns: Object.entries(columns as Record<string, any>).map(([column, info]) => ({
            column,
            type: info.type,
            nullable: info.nullable,
            default: info.defaultValue ?? null,
          })),
        })
      }

      return text({ total: schema.length, schema })
    }
  )

  server.registerTool(
    'database_query',
    {
      title: 'Run a read-only query',
      description:
        'Executes a single SELECT and returns the rows. Writes and DDL are rejected — use a migration for schema changes and the app itself for data changes.',
      inputSchema: {
        query: z.string().describe('A single SELECT statement'),
        limit: z.number().int().min(1).max(500).optional().describe('Row cap, default 50'),
      },
    },
    async ({ query, limit }) => {
      const sql = stripSqlComments(query)

      if (!/^select\b/i.test(sql) && !/^with\b/i.test(sql)) {
        return failure('Only SELECT (or WITH ... SELECT) statements are allowed.')
      }
      if (FORBIDDEN.test(sql)) {
        return failure('The statement contains a write or DDL keyword and was refused.')
      }
      if (sql.includes(';') && sql.indexOf(';') < sql.length - 1) {
        return failure('Multiple statements are not allowed.')
      }

      const app = await getApp()
      const db = await app.container.make('lucid.db')

      const cap = limit ?? 50
      const rows = await db.rawQuery(sql.replace(/;+\s*$/, ''))
      const list = Array.isArray(rows) ? rows : (rows?.rows ?? [])

      return text({
        returned: Math.min(list.length, cap),
        truncated: list.length > cap,
        rows: list.slice(0, cap),
      })
    }
  )

  server.registerTool(
    'list_models',
    {
      title: 'List Lucid models',
      description:
        'Models with their table, columns and declared relationships — cheaper than reading every file under app/models.',
      inputSchema: {},
    },
    async () => {
      const app = await getApp()
      const fs = await import('node:fs')
      const path = await import('node:path')

      const dir = app.makePath('app/models')
      if (!fs.existsSync(dir)) return text({ total: 0, models: [] })

      const models = []
      for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.ts'))) {
        const imported: any = await import(path.join(dir, file))
        const model = imported.default
        if (!model?.booted && typeof model?.boot === 'function') model.boot()

        models.push({
          file: `app/models/${file}`,
          class: model?.name,
          table: model?.table,
          columns: model?.$columnsDefinitions ? [...model.$columnsDefinitions.keys()] : [],
          relations: model?.$relationsDefinitions
            ? [...model.$relationsDefinitions.entries()].map(([name, relation]: [string, any]) => ({
                name,
                type: relation.type,
                related: relation.relatedModel?.()?.name,
              }))
            : [],
        })
      }

      return text({ total: models.length, models })
    }
  )
}
