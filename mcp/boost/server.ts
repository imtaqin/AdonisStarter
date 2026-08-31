/*
|--------------------------------------------------------------------------
| Adonis Boost — project-aware MCP server
|--------------------------------------------------------------------------
|
| The equivalent of Laravel Boost for this AdonisJS application. It boots the
| real app and exposes it to any MCP-capable agent (Claude Code, Crush, Kimi,
| Cursor, Codex, Gemini CLI, ...) so the agent can read routes, schema, config
| and errors instead of inferring them from source.
|
| Run:
|   node --import=@poppinss/ts-exec mcp/boost/server.ts
|   npm run mcp        (same thing)
|
| Transport is stdio, which means STDOUT IS THE PROTOCOL. Never `console.log`
| from a tool -- use console.error, which goes to stderr and shows up in the
| client's MCP log.
|
*/
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { registerApplicationTools } from './tools/application.js'
import { registerDatabaseTools } from './tools/database.js'
import { registerDebugTools } from './tools/debug.js'
import { registerGitTools } from './tools/git.js'
import { registerIconTools } from './tools/icons.js'
import { registerMemoryTools } from './tools/memory.js'
import { registerProjectTools } from './tools/project.js'

const server = new McpServer(
  { name: 'adonis-boost', version: '1.0.0' },
  {
    instructions: [
      'Project-aware tools for this AdonisJS application.',
      '',
      'START HERE, every session, before anything else:',
      '  1. memory_list        — decisions already made, AND whether the previous',
      '                          session left unfinished work. If it answers',
      '                          resuming:true, read that handoff and continue it',
      '                          instead of starting over.',
      '  2. project_conventions — the non-obvious framework rules',
      '  3. git_status          — what the working tree looks like right now',
      '',
      'END HERE, if you stop with work unfinished:',
      '  session_handoff — task, what is done and verified, what is next, what to',
      '                    watch out for. Call it again with done_all:true once the',
      '                    work is complete, so the next agent is not handed a',
      '                    stale baton. This memory is shared by every agent on',
      '                    this repo and committed to git, so a handoff written by',
      '                    Claude is picked up by Cursor, Gemini or Kimi verbatim.',
      '',
      'Then, as needed: list_routes, list_components, database_schema, last_errors.',
      'Picking an icon? Always search_icons — a wrong Font Awesome class renders',
      'as blank space with no error, so guessing fails silently.',
      'Prefer these tools over reading files: they reflect what the app actually',
      'loaded, and they cost far fewer tokens than a directory walk.',
    ].join('\n'),
  }
)

registerApplicationTools(server)
registerDatabaseTools(server)
registerProjectTools(server)
registerIconTools(server)
registerDebugTools(server)
registerMemoryTools(server)
registerGitTools(server)

const transport = new StdioServerTransport()
await server.connect(transport)

console.error('[adonis-boost] ready on stdio')
