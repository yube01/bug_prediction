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
    return (
      <div className="flex justify-center items-center gap-3 py-20 text-primary font-mono text-sm">
        <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        Fetching analysis data...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-4 rounded-lg bg-error/10 text-error border border-error/20 flex items-center gap-2 shadow-sm">
        <span className="text-lg">❌</span>
        <span className="text-sm font-medium">{error} — Make sure the backend server is running.</span>
      </div>
    )
  }

  if (history.length === 0 || !stats) {
    return <EmptyDashboardState />
  }

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="heading-2 bg-clip-text text-transparent bg-gradient-to-r from-fg to-fg-secondary">
          Analytics Dashboard
        </h1>
        <p className="text-sm text-fg-secondary max-w-3xl leading-relaxed">
          Aggregate analysis of all historical searches. Diffs, complexities, and developer
          metrics gathered from your public GitHub repository requests.
        </p>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <DashboardStatsCards stats={stats} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-in slide-in-from-bottom-6 duration-700">
        <RiskDistributionChart data={donutData} />
        <RepoComparisonChart data={barData} />
      </div>

      <div className="animate-in slide-in-from-bottom-8 duration-1000">
        <RepositoryHistoryPanel repos={uniqueRepos} onExplore={handleExploreRepo} onDelete={deleteEntry} />
      </div>
    </div>
  )
}