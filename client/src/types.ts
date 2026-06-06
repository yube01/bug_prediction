export interface GithubCommit {
  sha:    string
  commit: {
    message:   string
    author:    { name: string; email: string; date: string }
    committer: { name: string; date: string }
  }
  author: { login: string; avatar_url: string } | null
  stats?: { additions: number; deletions: number; total: number }
  files?: { filename: string; status: string }[]
}

export interface GithubBranch {
  name:   string
  commit: { sha: string }
}

export interface RepoStats {
  totalCommits: number
  contributors: number
  spanDays:     number
  oldestDate:   string
  newestDate:   string
}

export interface RateLimitInfo {
  remaining: number
  limit:     number
  resetAt:   Date
}

export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown'