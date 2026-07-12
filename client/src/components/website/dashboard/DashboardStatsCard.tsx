import type { DashboardStats } from '@/utils/dashboardUtils'

interface DashboardStatsCardsProps {
  stats: DashboardStats
}

export default function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="flex justify-between gap-4 rounded-xl border border-border p-4">
      <StatCard label="Repos Analyzed" value={stats.totalRepos} />
      <StatCard label="Total Commits" value={stats.totalCommits} />

      <div>
        <p className="text-xs text-fg2">High Risk Commits</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold text-error-text">{stats.totalHighRisk}</span>
          <span className="text-xs text-fg2">({stats.overallRiskRate}% rate)</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-fg2">Most Risky Repo</p>
        <div className="truncate text-xl font-semibold text-fg" title={stats.mostRiskyRepoFull}>
          {stats.mostRiskyRepo}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-fg2">{label}</p>
      <div className="text-xl font-semibold text-fg">{value}</div>
    </div>
  )
}