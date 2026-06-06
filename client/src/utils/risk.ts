import type { GithubCommit, RiskLevel } from '../types'

export function getRiskLevel(commit: GithubCommit): RiskLevel {
  if (!commit.stats) return 'unknown'

  const lines  = commit.stats.additions + commit.stats.deletions
  const files  = commit.files?.length ?? 0
  const msgL   = commit.commit.message.toLowerCase()
  const hour   = new Date(commit.commit.committer.date).getHours()
  const isNight = hour >= 22 || hour <= 5
  const isFix  = /fix|bug|patch|hotfix/.test(msgL)

  let score = 0
  if (lines > 500)  score += 2
  else if (lines > 100) score += 1
  if (files > 15)   score += 2
  else if (files > 5)  score += 1
  if (isNight)      score += 1
  if (isFix)        score += 1

  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  high:    'High risk',
  medium:  'Medium risk',
  low:     'Low risk',
  unknown: 'Unknown',
}