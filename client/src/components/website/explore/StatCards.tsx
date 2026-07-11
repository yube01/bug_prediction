import { Label } from '@/components/ui/label';
import type { RepoStats } from '@/types'

interface Props { stats: RepoStats; branch: string; repoName: string }

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-fill1 rounded-xl p-4 text-center" >
      <Label>{label}</Label>
      <div>{value}</div>
      {sub && <div>{sub}</div>}
    </div>
  )
}

export default function StatCards({ stats, branch, repoName }: Props) {
  const oldest = new Date(stats.oldestDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const perMonth = Math.round(stats.totalCommits / Math.max(stats.spanDays / 30, 1))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      <Card label="Commits" value={stats.totalCommits.toLocaleString()} sub={`~${perMonth} / month`} />
      <Card label="Contributors" value={String(stats.contributors)} sub="unique authors" />
      <Card label="Span" value={`${stats.spanDays}d`} sub={`${oldest} – now`} />
      <Card label="Branch" value={branch} sub={repoName} />
    </div>
  )
}