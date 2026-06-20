export interface GithubCommit {
  sha:    string
  commit: {
    message:   string
    author:    { name: string; email: string; date: string }
    committer: { name: string; date: string }
  }
  author: { login: string; avatar_url: string } | null
  stats?: { additions: number; deletions: number; total: number }
  files?: { filename: string; status: string; additions?: number; deletions?: number; changes?: number; patch?: string }[]
  prediction?: PredictionResponse
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

export interface CommitFeatures {
  lines_added: number
  lines_deleted: number
  files_changed: number
  churn_ratio: number
  avg_complexity: number
  num_methods: number
  complexity_per_file: number
  test_files_changed: number
  test_ratio: number
  prior_bugs_author: number
  commit_hour: number
  day_of_week: number
  is_weekend: number
  is_night_commit: number
  language_group: 'Python' | 'TypeScript'
  time_period: '2018-2020' | '2021-2023' | '2024-2026'
}

export interface PredictionResponse {
  bug_probability: number
  risk_level: string
  risk_icon: string
  risk_score: number
  recommendation: string
  top_risk_factors: string[]
}

export interface BatchResponse {
  total: number
  high_risk: number
  medium_risk: number
  low_risk: number
  predictions: PredictionResponse[]
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  version: string
  description: string
}

export interface ModelInfoResponse {
  model_type: string
  training_data: string
  test_auc: number
  test_precision: number
  test_recall: number
  test_f1: number
  features: string[]
  top_predictor: string
}
