import type { SearchHistoryItem } from '../api/auth'

export type SortOption = 'date' | 'name' | 'commits' | 'high_risk'

export interface DashboardStats {
  totalRepos: number
  totalCommits: number
  totalHighRisk: number
  totalMediumRisk: number
  totalLowRisk: number
  avgCommits: number
  overallRiskRate: number
  mostRiskyRepo: string
  mostRiskyRepoFull: string
}

export interface DonutDatum {
  name: string
  value: number
  color: string
}

export interface BarDatum {
  name: string
  fullName: string
  'Low Risk': number
  'Medium Risk': number
  'High Risk': number
}

/** Deduplicates search history, keeping the most recent search per repo (history is newest-first). */
export function getUniqueRepos(history: SearchHistoryItem[]): SearchHistoryItem[] {
  const map = new Map<string, SearchHistoryItem>()
  history.forEach(item => {
    if (!map.has(item.repo_name)) {
      map.set(item.repo_name, item)
    }
  })
  return Array.from(map.values())
}

export function calculateDashboardStats(uniqueRepos: SearchHistoryItem[]): DashboardStats | null {
  if (uniqueRepos.length === 0) return null

  let totalCommits = 0
  let totalHighRisk = 0
  let totalMediumRisk = 0
  let totalLowRisk = 0

  uniqueRepos.forEach(r => {
    totalCommits += r.total_commits
    totalHighRisk += r.high_risk_count
    totalMediumRisk += r.medium_risk_count
    totalLowRisk += r.low_risk_count
  })

  const avgCommits = totalCommits / uniqueRepos.length
  const overallRiskRate = totalCommits > 0 ? (totalHighRisk / totalCommits) * 100 : 0

  let mostRiskyRepo = ''
  let maxRiskRatio = -1
  uniqueRepos.forEach(r => {
    if (r.total_commits > 0) {
      const ratio = r.high_risk_count / r.total_commits
      if (ratio > maxRiskRatio) {
        maxRiskRatio = ratio
        mostRiskyRepo = r.repo_name
      }
    }
  })

  return {
    totalRepos: uniqueRepos.length,
    totalCommits,
    totalHighRisk,
    totalMediumRisk,
    totalLowRisk,
    avgCommits: Math.round(avgCommits),
    overallRiskRate: Math.round(overallRiskRate * 10) / 10,
    mostRiskyRepo: mostRiskyRepo ? mostRiskyRepo.split('/')[1] : 'None',
    mostRiskyRepoFull: mostRiskyRepo,
  }
}

export function getDonutData(stats: DashboardStats | null): DonutDatum[] {
  if (!stats) return []
  return [
    { name: 'Low Risk', value: stats.totalLowRisk, color: '#00c97a' },
    { name: 'Medium Risk', value: stats.totalMediumRisk, color: '#f5a800' },
    { name: 'High Risk', value: stats.totalHighRisk, color: '#f03a4f' },
  ].filter(d => d.value > 0)
}

export function getBarData(uniqueRepos: SearchHistoryItem[]): BarDatum[] {
  return uniqueRepos.slice(0, 6).map(r => ({
    name: r.repo_name.split('/')[1] || r.repo_name,
    fullName: r.repo_name,
    'Low Risk': r.low_risk_count,
    'Medium Risk': r.medium_risk_count,
    'High Risk': r.high_risk_count,
  }))
}

export function filterAndSortRepos(
  uniqueRepos: SearchHistoryItem[],
  filterText: string,
  sortBy: SortOption,
): SearchHistoryItem[] {
  return uniqueRepos
    .filter(r => r.repo_name.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.repo_name.localeCompare(b.repo_name)
      if (sortBy === 'commits') return b.total_commits - a.total_commits
      if (sortBy === 'high_risk') return b.high_risk_count - a.high_risk_count
      return new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime()
    })
}