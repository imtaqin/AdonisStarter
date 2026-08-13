import { z } from 'zod'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { APP_ROOT } from '../adonis.js'
import { failure, text } from '../reply.js'

const run = promisify(execFile)
const CWD = fileURLToPath(APP_ROOT)

/**
 * Git as context.
 *
 * History answers questions the current source cannot: why a line looks the way
 * it does, what the team's conventions actually are (as opposed to what a style
 * guide claims), and which files churn together.
 *
 * `execFile` with an argument array — never a shell string — so a branch name
 * or search term can't turn into command injection.
 */
async function git(args: string[]): Promise<string> {
  const { stdout } = await run('git', args, { cwd: CWD, maxBuffer: 8 * 1024 * 1024 })
  return stdout
}

/**
 * True when the repository has no commits yet. Every history tool has to answer
 * for this: a freshly scaffolded project is exactly the case where an agent
 * reaches for git context, and `HEAD` does not resolve until the first commit.
 */
async function hasCommits(): Promise<boolean> {
  try {
    await git(['rev-parse', '--verify', 'HEAD'])
    return true
  } catch {
    return false
  }
}

const NO_COMMITS = {
  repository: 'initialised but empty',
  note: 'No commits yet, so there is no history to read. Make the first commit to enable the git_* tools.',
}

export function registerGitTools(server: McpServer) {
  server.registerTool(
    'git_status',
    {
      title: 'Working tree status',
      description:
        'Current branch, staged/unstaged/untracked files and the diff stat. Call before committing, and at the start of a session to see what a previous run left behind.',
      inputSchema: {},
    },
    async () => {
      try {
        const committed = await hasCommits()

        const [branch, status, stat] = await Promise.all([
          /**
           * `rev-parse HEAD` cannot name the branch before the first commit;
           * `symbolic-ref` reads the ref HEAD points at, which exists from
           * `git init` onwards.
           */
          (committed
            ? git(['rev-parse', '--abbrev-ref', 'HEAD'])
            : git(['symbolic-ref', '--short', 'HEAD'])
          ).catch(() => 'unknown'),
          git(['status', '--porcelain=v1']),
          committed ? git(['diff', '--stat']) : Promise.resolve(''),
        ])

        const files = status
          .split('\n')
          .filter(Boolean)
          .map((line) => ({ state: line.slice(0, 2).trim(), path: line.slice(3) }))

        return text({
          branch: branch.trim().replace('refs/heads/', ''),
          hasCommits: committed,
          ...(committed ? {} : NO_COMMITS),
          dirty: files.length > 0,
          fileCount: files.length,
          files: files.slice(0, 200),
          diffStat: stat.trim().split('\n').filter(Boolean),
        })
      } catch (error) {
        return failure('git status failed', { message: (error as Error).message })
      }
    }
  )

  server.registerTool(
    'git_recent_commits',
    {
      title: 'Recent commits',
      description:
        'Recent history with the files each commit touched. Use it to understand what has been happening before you change anything.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional().describe('Default 10'),
        path: z.string().optional().describe('Only commits touching this path'),
      },
    },
    async ({ limit, path: filter }) => {
      try {
        if (!(await hasCommits())) return text(NO_COMMITS)

        const args = [
          'log',
          `-n${limit ?? 10}`,
          '--pretty=format:%H%x1f%an%x1f%ar%x1f%s',
          '--name-only',
        ]
        if (filter) args.push('--', filter)

        const raw = await git(args)
        const commits = raw
          .split('\n\n')
          .filter(Boolean)
          .map((block) => {
            const [header, ...files] = block.split('\n')
            const [hash, author, when, subject] = header.split('\x1f')
            return {
              hash: hash?.slice(0, 8),
              author,
              when,
              subject,
              files: files.filter(Boolean),
            }
          })

        return text({ total: commits.length, commits })
      } catch (error) {
        return failure('git log failed', { message: (error as Error).message })
      }
    }
  )

  server.registerTool(
    'git_search_history',
    {
      title: 'Search history for a string',
      description:
        'Pickaxe search: finds the commits that added or removed a string. The fastest way to answer "when did this appear, and why?".',
      inputSchema: {
        query: z.string().describe('Literal string to look for in diffs'),
        limit: z.number().int().min(1).max(30).optional(),
      },
    },
    async ({ query, limit }) => {
      try {
        if (!(await hasCommits())) return text(NO_COMMITS)

        const raw = await git([
          'log',
          `-n${limit ?? 10}`,
          '-S',
          query,
          '--pretty=format:%H%x1f%an%x1f%ar%x1f%s',
        ])

        const commits = raw
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [hash, author, when, subject] = line.split('\x1f')
            return { hash: hash?.slice(0, 8), author, when, subject }
          })

        return text({ query, total: commits.length, commits })
      } catch (error) {
        return failure('git log -S failed', { message: (error as Error).message })
      }
    }
  )

  server.registerTool(
    'git_diff',
    {
      title: 'Show a diff',
      description: 'Diff of the working tree, the staged changes, or a specific commit/range.',
      inputSchema: {
        target: z
          .string()
          .optional()
          .describe(
            '"staged", a commit hash, or a range like main..HEAD. Omit for unstaged changes.'
          ),
        path: z.string().optional(),
        statOnly: z.boolean().optional().describe('Return only the summary (default false)'),
      },
    },
    async ({ target, path: filter, statOnly }) => {
      try {
        if (!(await hasCommits())) return text(NO_COMMITS)

        const args = ['diff']
        if (target === 'staged') args.push('--cached')
        else if (target) args.push(target)
        if (statOnly) args.push('--stat')
        if (filter) args.push('--', filter)

        const raw = await git(args)
        const lines = raw.split('\n')

        return text({
          target: target ?? 'working tree',
          truncated: lines.length > 600,
          diff: lines.slice(0, 600).join('\n'),
        })
      } catch (error) {
        return failure('git diff failed', { message: (error as Error).message })
      }
    }
  )

  server.registerTool(
    'git_conventions',
    {
      title: 'Infer repo conventions from history',
      description:
        'Derives the commit message style actually in use and lists the files that change most often. Match the existing style rather than imposing a new one.',
      inputSchema: {
        sample: z
          .number()
          .int()
          .min(20)
          .max(500)
          .optional()
          .describe('Commits to analyse, default 100'),
      },
    },
    async ({ sample }) => {
      try {
        if (!(await hasCommits())) return text(NO_COMMITS)

        const size = sample ?? 100
        const [subjects, files] = await Promise.all([
          git(['log', `-n${size}`, '--pretty=format:%s']),
          git(['log', `-n${size}`, '--name-only', '--pretty=format:']),
        ])

        const list = subjects.split('\n').filter(Boolean)
        const conventional = list.filter((s) =>
          /^(feat|fix|chore|docs|refactor|test|build|ci|perf|style)(\(.+\))?!?:/.test(s)
        )

        const counts = new Map<string, number>()
        for (const file of files.split('\n').filter(Boolean)) {
          counts.set(file, (counts.get(file) ?? 0) + 1)
        }

        return text({
          analysed: list.length,
          commitStyle: {
            conventionalCommits: `${conventional.length}/${list.length}`,
            recommendation:
              conventional.length > list.length / 2
                ? 'Use Conventional Commits (type(scope): subject).'
                : 'Free-form subjects; match the tone of the samples below.',
            samples: list.slice(0, 8),
          },
          hotspots: [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([file, count]) => ({ file, commits: count })),
        })
      } catch (error) {
        return failure('git log failed', { message: (error as Error).message })
      }
    }
  )

  server.registerTool(
    'git_file_context',
    {
      title: 'History and authorship of one file',
      description:
        'Who last touched a file, when, and through which commits. Use before a risky edit to see whether it is settled code or churning.',
      inputSchema: {
        path: z.string().describe('Repo-relative path'),
        limit: z.number().int().min(1).max(30).optional(),
      },
    },
    async ({ path: target, limit }) => {
      try {
        if (!(await hasCommits())) return text(NO_COMMITS)

        const raw = await git([
          'log',
          `-n${limit ?? 10}`,
          '--pretty=format:%H%x1f%an%x1f%ar%x1f%s',
          '--',
          target,
        ])

        const commits = raw
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            const [hash, author, when, subject] = line.split('\x1f')
            return { hash: hash?.slice(0, 8), author, when, subject }
          })

        if (commits.length === 0) {
          return text({
            path: target,
            tracked: false,
            note: 'No history — the file is new or untracked.',
          })
        }

        return text({ path: target, tracked: true, lastChanged: commits[0].when, commits })
      } catch (error) {
        return failure('git log failed', { message: (error as Error).message })
      }
    }
  )
}
