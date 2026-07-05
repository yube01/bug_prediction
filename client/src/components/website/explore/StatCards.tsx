import type { RepoStats } from '@/types'

interface Props { stats: RepoStats; branch: string; repoName: string }

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-md)',
      padding: '0.9rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function StatCards({ stats, branch, repoName }: Props) {
  const oldest = new Date(stats.oldestDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  const perMonth = Math.round(stats.totalCommits / Math.max(stats.spanDays / 30, 1))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      <Card label="Commits"      value={stats.totalCommits.toLocaleString()} sub={`~${perMonth} / month`} />
      <Card label="Contributors" value={String(stats.contributors)}          sub="unique authors" />
      <Card label="Span"         value={`${stats.spanDays}d`}                sub={`${oldest} – now`} />
      <Card label="Branch"       value={branch}                              sub={repoName} />
    </div>
  )
}