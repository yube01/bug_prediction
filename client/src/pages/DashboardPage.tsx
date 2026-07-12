import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import { getUniqueRepos, calculateDashboardStats, getDonutData, getBarData } from '../utils/dashboardUtils'
import EmptyDashboardState from '@/components/website/dashboard/EmptyDashboardState'
import DashboardStatsCards from '@/components/website/dashboard/DashboardStatsCard'
import RiskDistributionChart from '@/components/website/dashboard/RiskDistributionCard'
import RepoComparisonChart from '@/components/website/dashboard/RiskComparisonChart'
import RepositoryHistoryPanel from '@/components/website/dashboard/RepoHistoryPanel'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { history, loading, error, deleteEntry } = useSearchHistory()

  const uniqueRepos = useMemo(() => getUniqueRepos(history), [history])
  const stats = useMemo(() => calculateDashboardStats(uniqueRepos), [uniqueRepos])
  const donutData = useMemo(() => getDonutData(stats), [stats])
  const barData = useMemo(() => getBarData(uniqueRepos), [uniqueRepos])

  const handleExploreRepo = (repoName: string, branch: string) => {
    navigate(`/?repo=${encodeURIComponent(repoName)}&branch=${encodeURIComponent(branch)}`)
  }

  if (loading) {
    return <div className="p-5 text-sm text-fg2">Fetching analysis data...</div>
  }

  if (error) {
    return (
      <div className="p-5 text-sm text-[#f03a4f]">
        ❌ {error} — Make sure the backend server is running.
      </div>
    )
  }

  if (history.length === 0 || !stats) {
    return <EmptyDashboardState />
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <h1 className="heading-1">Analytics Dashboard</h1>
        <p className="text-sm text-fg2">
          Aggregate analysis of all historical searches. Diffs, complexities, and developer
          metrics gathered from your public GitHub repository requests.
        </p>
      </div>

      <DashboardStatsCards stats={stats} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RiskDistributionChart data={donutData} />
        <RepoComparisonChart data={barData} />
      </div>

      <RepositoryHistoryPanel repos={uniqueRepos} onExplore={handleExploreRepo} onDelete={deleteEntry} />
    </div>
  )
}