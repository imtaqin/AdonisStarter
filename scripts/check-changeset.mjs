/**
 * Fails when the working tree has changes but no changeset describes them.
 *
 * AGENTS.md §9 makes a changeset mandatory for every task. A rule that lives
 * only in prose is a rule agents skip under time pressure, so it is enforced
 * here instead: `npm run changeset:check` is cheap enough to sit next to
 * `typecheck` in the definition of done.
 *
 * Scope is deliberately the whole diff against the base branch (plus anything
 * uncommitted), not just staged files -- an agent that forgot to commit should
 * still be told it owes a note.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const BASE = JSON.parse(readFileSync('.changeset/config.json', 'utf8')).baseBranch ?? 'main'

/**
 * Paths that cannot change what another reader of this repo sees. Keep this
 * list identical to the exemptions documented in AGENTS.md §9 -- if they drift,
 * the doc is the one that is wrong.
 */
const EXEMPT = [/^\.changeset\//, /^package-lock\.json$/]

function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

const changed = new Set()
for (const line of git('status', '--porcelain').split('\n')) {
  if (!line) continue
  // Porcelain v1: "XY path" or "XY old -> new" for renames.
  const path = line.slice(3)
  changed.add(path.includes(' -> ') ? path.split(' -> ')[1] : path)
}

// Committed work on a feature branch counts too, not just the dirty tree.
const mergeBase = git('merge-base', 'HEAD', BASE)
if (mergeBase && mergeBase !== git('rev-parse', 'HEAD')) {
  for (const path of git('diff', '--name-only', `${mergeBase}...HEAD`).split('\n')) {
    if (path) changed.add(path)
  }
}

const relevant = [...changed].filter((path) => !EXEMPT.some((re) => re.test(path)))

if (relevant.length === 0) {
  console.log('No changes needing a changeset.')
  process.exit(0)
}

const notes = readdirSync('.changeset').filter(
  (file) => file.endsWith('.md') && file !== 'README.md'
)

if (notes.length > 0) {
  console.log(`${relevant.length} changed file(s), ${notes.length} changeset(s). OK.`)
  process.exit(0)
}

console.error(
  [
    '',
    `Missing changeset: ${relevant.length} file(s) changed against "${BASE}" and`,
    '.changeset/ has no note describing them.',
    '',
    ...relevant.slice(0, 15).map((path) => `  ${path}`),
    ...(relevant.length > 15 ? [`  ...and ${relevant.length - 15} more`] : []),
    '',
    'Run `npm run changeset` and describe the change. See AGENTS.md §9.',
    '',
  ].join('\n')
)
process.exit(1)
