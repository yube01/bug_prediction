import type { CommitFeatures, GithubCommit } from '../types'

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

export function buildCommitFeatures(commits: GithubCommit[]): CommitFeatures[] {
  const priorBySha = priorBugCountsBySha(commits)

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
    const messageBoost = BUG_WORDS.test(commit.commit.message) ? 2 : 0
    const avgComplexity = Math.min(20, Math.max(1, filesChanged * 0.8 + messageBoost))
    const numMethods = Math.max(0, Math.round(filesChanged * 1.5))

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
