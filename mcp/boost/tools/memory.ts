import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { APP_ROOT } from '../adonis.js'
import { failure, text } from '../reply.js'

/**
 * Project memory: durable notes that survive a session, shared by every agent
 * that connects to this server.
 *
 * Stored as plain markdown in `.agent/memory/` so it is reviewable in a diff
 * and versioned with the code. What belongs here is what the repository cannot
 * already tell you: decisions and their reasons, dead ends, environment quirks.
 * Not code structure, not git history.
 */
const MEMORY_DIR = fileURLToPath(new URL('.agent/memory/', APP_ROOT))

const KIND = z.enum(['decision', 'gotcha', 'preference', 'todo', 'reference'])

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function ensureDir() {
  fs.mkdirSync(MEMORY_DIR, { recursive: true })
}

type Entry = {
  slug: string
  title: string
  kind: string
  tags: string[]
  updated: string
  body: string
}

function parse(file: string): Entry | null {
  const raw = fs.readFileSync(path.join(MEMORY_DIR, file), 'utf8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null

  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':')
    if (key) meta[key.trim()] = rest.join(':').trim()
  }

  return {
    slug: file.replace(/\.md$/, ''),
    title: meta.title ?? file,
    kind: meta.kind ?? 'reference',
    tags: (meta.tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    updated: meta.updated ?? '',
    body: match[2].trim(),
  }
}

function readAll(): Entry[] {
  ensureDir()
  return fs
    .readdirSync(MEMORY_DIR)
    .filter((file) => file.endsWith('.md') && file !== 'INDEX.md')
    .map(parse)
    .filter((entry): entry is Entry => Boolean(entry))
    .sort((a, b) => b.updated.localeCompare(a.updated))
}

/** Keeps INDEX.md in sync so a human (or a grep) can see everything at a glance. */
function writeIndex() {
  const entries = readAll()
  const lines = [
    '# Project memory',
    '',
    'Maintained by the `memory_*` MCP tools. One file per note.',
    '',
    ...entries.map(
      (entry) => `- **${entry.title}** (\`${entry.slug}\`, ${entry.kind}) — ${entry.updated}`
    ),
    '',
  ]
  fs.writeFileSync(path.join(MEMORY_DIR, 'INDEX.md'), lines.join('\n'))
}

export function registerMemoryTools(server: McpServer) {
  server.registerTool(
    'memory_list',
    {
      title: 'List project memory',
      description:
        'Durable notes about this project: decisions, gotchas, preferences. Call this at the start of a session — it is cheap and prevents repeating work that was already settled.',
      inputSchema: {
        kind: KIND.optional(),
        tag: z.string().optional(),
      },
    },
    async ({ kind, tag }) => {
      const entries = readAll()
        .filter((entry) => !kind || entry.kind === kind)
        .filter((entry) => !tag || entry.tags.includes(tag))
        .map(({ slug, title, kind: entryKind, tags, updated }) => ({
          slug,
          title,
          kind: entryKind,
          tags,
          updated,
        }))

      return text({
        total: entries.length,
        hint: 'Use memory_read to get the body of one entry.',
        entries,
      })
    }
  )

  server.registerTool(
    'memory_read',
    {
      title: 'Read a memory entry',
      description: 'Full body of one note by its slug.',
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      const entry = readAll().find((item) => item.slug === slugify(slug))
      if (!entry) return failure(`No memory entry named "${slug}". Use memory_list.`)
      return text(entry)
    }
  )

  server.registerTool(
    'memory_search',
    {
      title: 'Search project memory',
      description: 'Case-insensitive search across titles, tags and bodies.',
      inputSchema: { query: z.string() },
    },
    async ({ query }) => {
      const needle = query.toLowerCase()
      const hits = readAll()
        .map((entry) => {
          const haystack = `${entry.title} ${entry.tags.join(' ')} ${entry.body}`.toLowerCase()
          const index = haystack.indexOf(needle)
          if (index === -1) return null
          return {
            slug: entry.slug,
            title: entry.title,
            kind: entry.kind,
            excerpt: entry.body.slice(Math.max(0, index - 120), index + 240),
          }
        })
        .filter(Boolean)

      return text({ total: hits.length, hits })
    }
  )

  server.registerTool(
    'memory_write',
    {
      title: 'Write a memory entry',
      description:
        'Records something worth remembering across sessions. Write the REASON, not just the fact — "we use GET/POST only because the team standardised on it" beats "no PUT". Re-writing an existing slug updates it. Do not store what the code or git history already says.',
      inputSchema: {
        title: z.string().describe('Short human title'),
        body: z.string().describe('Markdown. Include why, not only what.'),
        kind: KIND.optional().describe('decision | gotcha | preference | todo | reference'),
        tags: z.array(z.string()).optional(),
        slug: z.string().optional().describe('Defaults to a slug of the title'),
      },
    },
    async ({ title, body, kind, tags, slug }) => {
      ensureDir()
      const id = slugify(slug ?? title)
      if (!id) return failure('Could not derive a slug from the title.')

      const file = path.join(MEMORY_DIR, `${id}.md`)
      const existed = fs.existsSync(file)

      const front = [
        '---',
        `title: ${title}`,
        `kind: ${kind ?? 'reference'}`,
        `tags: ${(tags ?? []).join(', ')}`,
        `updated: ${new Date().toISOString().slice(0, 10)}`,
        '---',
        '',
      ].join('\n')

      fs.writeFileSync(file, front + body.trim() + '\n')
      writeIndex()

      return text({
        slug: id,
        action: existed ? 'updated' : 'created',
        file: `.agent/memory/${id}.md`,
      })
    }
  )

  server.registerTool(
    'memory_delete',
    {
      title: 'Delete a memory entry',
      description: 'Removes a note that turned out to be wrong or obsolete.',
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      const id = slugify(slug)
      const file = path.join(MEMORY_DIR, `${id}.md`)
      if (!fs.existsSync(file)) return failure(`No memory entry named "${slug}".`)

      fs.rmSync(file)
      writeIndex()
      return text({ slug: id, action: 'deleted' })
    }
  )
}
