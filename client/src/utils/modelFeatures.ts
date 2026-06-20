import type { CommitFeatures, GithubCommit } from '../types'
import { analyzePatch } from './patchAnalysis'

const BUG_WORDS = /\b(bug|fix|fixed|hotfix|patch|defect|regression|issue)\b/i
const TEST_PATH = /(^|\/|\\)(test|tests|spec|__tests__)(\/|\\)|\.test\.|\.spec\./i

function languageGroup(commit: GithubCommit): CommitFeatures['language_group'] {
  const files = commit.files ?? []
  const typeScriptFiles = files.filter(f => /\.(ts|tsx|js|jsx)$/i.test(f.filename)).length
  const pythonFiles = files.filter(f => /\.py$/i.test(f.filename)).length
  return typeScriptFiles > pythonFiles ? 'TypeScript' : 'Python'
}

function timePeriod(date: Date): CommitFeatures['time_period'] {
  const year = date.getFullYear()
  if (year <= 2020) return '2018-2020'
  if (year <= 2023) return '2021-2023'
  return '2024-2026'
}

/**
 * Count prior bugs per commit using batch-local commit messages.
 * This is the fallback when full-history counts aren't available.
 */
function priorBugCountsBySha(commits: GithubCommit[]): Map<string, number> {
  const sorted = [...commits].sort((a, b) =>
    new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime()
  )
  const countsByAuthor = new Map<string, number>()
  const countsBySha = new Map<string, number>()

  for (const commit of sorted) {
    const author = commit.commit.author.email || commit.commit.author.name
    const previous = countsByAuthor.get(author) ?? 0
    countsBySha.set(commit.sha, previous)

    if (BUG_WORDS.test(commit.commit.message)) {
      countsByAuthor.set(author, previous + 1)
    }
  }

  return countsBySha
}

/**
 * Merge batch-local prior bug counts with full-history counts from GitHub API.
 * 
 * Full-history counts represent the author's total bug-fix commits across the
 * entire repo (up to 100 most recent). This is much closer to the training
 * data's `prior_bugs_author` which was computed across the full repo history.
 * 
 * When full-history data is available, we use it directly. Otherwise we fall
 * back to the batch-local count (which only sees the loaded ~200 commits).
 */
function mergedPriorBugCounts(
  commits: GithubCommit[],
  fullHistoryCounts?: Map<string, number>,
): Map<string, number> {
  const batchCounts = priorBugCountsBySha(commits)

  if (!fullHistoryCounts || fullHistoryCounts.size === 0) {
    return batchCounts
  }

  // For each commit, prefer the full-history count for its author
  const merged = new Map<string, number>()
  for (const commit of commits) {
    const authorKey = commit.commit.author.email || commit.commit.author.name
    const fullCount = fullHistoryCounts.get(authorKey)
    if (fullCount !== undefined) {
      // Use full-history count (subtract 1 if this commit itself is a fix,
      // since prior_bugs_author should only count PRIOR bugs)
      const isFix = BUG_WORDS.test(commit.commit.message) ? 1 : 0
      merged.set(commit.sha, Math.max(0, fullCount - isFix))
    } else {
      // Fall back to batch-local count
      merged.set(commit.sha, batchCounts.get(commit.sha) ?? 0)
    }
  }

  return merged
}

/**
 * Build model-ready features from GitHub commit data.
 * 
 * Key improvements over the previous version:
 * 1. avg_complexity — Computed from actual patch content (decision points in diffs)
 *    instead of the crude `files × 0.8` proxy. ~36% of model SHAP importance
 *    depends on complexity features.
 * 
 * 2. num_methods — Counted from function/class definitions in the patch
 *    instead of `files × 1.5`.
 * 
 * 3. prior_bugs_author — Can now use full-history counts from GitHub API
 *    instead of only counting within the loaded ~200 commit batch.
 *    This is the #1 predictor (SHAP importance 0.829).
 * 
 * @param commits          Array of GitHub commits with full detail (files + patches)
 * @param authorBugCounts  Optional map of author email → total bug-fix count from full repo history
 */
export function buildCommitFeatures(
  commits: GithubCommit[],
  authorBugCounts?: Map<string, number>,
): CommitFeatures[] {
  const priorBySha = mergedPriorBugCounts(commits, authorBugCounts)

  return commits.map(commit => {
    const date = new Date(commit.commit.author.date)
    const files = commit.files ?? []
    const filesChanged = Math.max(files.length, 1)
    const linesAdded = commit.stats?.additions ?? files.reduce((sum, f) => sum + (f.additions ?? 0), 0)
    const linesDeleted = commit.stats?.deletions ?? files.reduce((sum, f) => sum + (f.deletions ?? 0), 0)
    const testFilesChanged = files.filter(f => TEST_PATH.test(f.filename)).length
    const commitHour = date.getHours()
    const jsDay = date.getDay()
    const dayOfWeek = (jsDay + 6) % 7
    const isWeekend = dayOfWeek >= 5 ? 1 : 0
    const isNightCommit = commitHour >= 22 || commitHour < 5 ? 1 : 0

    // ── NEW: Real complexity from patch analysis ──────────────────────────
    // Instead of `filesChanged * 0.8`, we parse the actual diff content for
    // decision points (if/for/while/catch/&&/||) and function definitions.
    const patchResult = analyzePatch(files)
    const avgComplexity = patchResult.avgComplexity
    const numMethods = patchResult.numMethods

    return {
      lines_added: linesAdded,
      lines_deleted: linesDeleted,
      files_changed: filesChanged,
      churn_ratio: Number((linesAdded / (linesDeleted + 1)).toFixed(2)),
      avg_complexity: Number(avgComplexity.toFixed(2)),
      num_methods: numMethods,
      complexity_per_file: Number((avgComplexity / filesChanged).toFixed(2)),
      test_files_changed: testFilesChanged,
      test_ratio: Number((testFilesChanged / filesChanged).toFixed(2)),
      prior_bugs_author: priorBySha.get(commit.sha) ?? 0,
      commit_hour: commitHour,
      day_of_week: dayOfWeek,
      is_weekend: isWeekend,
      is_night_commit: isNightCommit,
      language_group: languageGroup(commit),
      time_period: timePeriod(date),
    }
  })
}
