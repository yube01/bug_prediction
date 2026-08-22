import { useEffect, useState, useMemo } from 'react'
import { getLeaderboard, type LeaderboardEntry, type LeaderboardResponse } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Trophy, Users, GitBranch, Bug, Crown, Medal, Award } from 'lucide-react'

/* ─── Animated Counter ─────────────────────────────────────── */
function AnimatedCounter({ end, duration = 1200, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (end === 0) { setCount(0); return }
    let start = 0
    const step = Math.max(1, Math.floor(end / (duration / 16)))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return <>{count.toLocaleString()}{suffix}</>
}

/* ─── Rank Badge ───────────────────────────────────────────── */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl" title="1st Place">🥇</span>
  if (rank === 2) return <span className="text-2xl" title="2nd Place">🥈</span>
  if (rank === 3) return <span className="text-2xl" title="3rd Place">🥉</span>
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-fill3 border border-border text-xs font-bold text-fg-secondary">
      {rank}
    </span>
  )
}

/* ─── Podium Card ──────────────────────────────────────────── */
function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const colors = {
    1: {
      border: 'border-amber/40',
      glow: 'shadow-[0_0_30px_-5px] shadow-amber/20',
      bg: 'bg-gradient-to-br from-amber-accent/60 to-fill1',
      icon: <Crown className="w-6 h-6 text-amber" />,
      badge: '🥇',
      label: '1st Place',
      ring: 'ring-2 ring-amber/20',
    },
    2: {
      border: 'border-fg-secondary/30',
      glow: 'shadow-[0_0_24px_-5px] shadow-fg-secondary/15',
      bg: 'bg-gradient-to-br from-fill2/80 to-fill1',
      icon: <Medal className="w-5 h-5 text-fg-secondary" />,
      badge: '🥈',
      label: '2nd Place',
      ring: 'ring-1 ring-fg-secondary/15',
    },
    3: {
      border: 'border-orange/30',
      glow: 'shadow-[0_0_24px_-5px] shadow-orange/15',
      bg: 'bg-gradient-to-br from-orange-accent/50 to-fill1',
      icon: <Award className="w-5 h-5 text-orange" />,
      badge: '🥉',
      label: '3rd Place',
      ring: 'ring-1 ring-orange/15',
    },
  }
  const c = colors[position]

  return (
    <div
      className={`
        relative flex flex-col items-center gap-4 rounded-2xl border p-6 backdrop-blur-sm
        transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1
        ${c.border} ${c.glow} ${c.bg} ${c.ring}
        ${position === 1 ? 'lg:-mt-4 order-2 lg:order-2' : position === 2 ? 'order-1 lg:order-1' : 'order-3 lg:order-3'}
      `}
      style={{
        animationDelay: `${(position - 1) * 150}ms`,
      }}
    >
      {/* Medal */}
      <div className="text-4xl mb-1">{c.badge}</div>

      {/* Avatar */}
      <div className={`
        w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold
        ${position === 1
          ? 'bg-gradient-to-br from-amber to-amber-hover text-black'
          : position === 2
            ? 'bg-gradient-to-br from-fg-secondary to-fg-tertiary text-bg'
            : 'bg-gradient-to-br from-orange to-orange-hover text-black'
        }
      `}>
        {entry.full_name.charAt(0).toUpperCase()}
      </div>

      {/* Name & email */}
      <div className="text-center">
        <p className="font-semibold text-fg text-sm">{entry.full_name}</p>
        <p className="text-xs text-fg-tertiary font-mono">{entry.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full mt-2">
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-fill2/60 border border-soft">
          <span className="text-xs text-fg-secondary">Repos</span>
          <span className="text-lg font-bold text-fg">{entry.repos_checked}</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-fill2/60 border border-soft">
          <span className="text-xs text-fg-secondary">Bugs</span>
          <span className="text-lg font-bold text-error-text">{entry.bugs_found}</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-fill2/60 border border-soft col-span-2">
          <span className="text-xs text-fg-secondary">Commits Analyzed</span>
          <span className="text-lg font-bold text-primary-text">{entry.total_commits_analyzed.toLocaleString()}</span>
        </div>
      </div>

      {/* Corner icon */}
      <div className="absolute top-3 right-3 opacity-40">
        {c.icon}
      </div>
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function LeaderboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getLeaderboard()
      .then(setData)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const topThree = useMemo(() => data?.entries.slice(0, 3) ?? [], [data])
  const remaining = useMemo(() => data?.entries.slice(3) ?? [], [data])

  // Find current user in the leaderboard (match by masked email pattern)
  const currentUserRank = useMemo(() => {
    if (!user || !data) return null
    // Compare by name since email is masked
    return data.entries.find(e => e.full_name === user.full_name)?.rank ?? null
  }, [user, data])

  if (loading) {
    return (
      <div className="flex justify-center items-center gap-3 py-20 text-primary font-mono text-sm">
        <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        Loading leaderboard...
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

  if (!data || data.entries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center animate-in fade-in duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-fill2 border border-border mb-6">
          <Trophy className="w-10 h-10 text-fg-tertiary" />
        </div>
        <h2 className="heading-4 text-fg mb-2">No Rankings Yet</h2>
        <p className="text-fg-secondary text-sm max-w-md mx-auto">
          Be the first to check a repository for bugs! Head to the <strong>Explorer</strong> page and scan a repo to appear on the leaderboard.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-accent to-fill2 border border-amber/20 shadow-lg shadow-amber/10">
            <Trophy className="w-7 h-7 text-amber" />
          </div>
          <h1 className="heading-2 bg-clip-text text-transparent bg-gradient-to-r from-amber via-fg to-fg-secondary">
            Bug Hunter Leaderboard
          </h1>
        </div>
        <p className="text-sm text-fg-secondary max-w-2xl leading-relaxed lg:ml-14">
          Ranking of users who have scanned repositories for potential bugs. Climb the ranks by exploring more repos!
        </p>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
        <Card className="bg-fill1/70 backdrop-blur-sm border-border shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-fg-secondary font-mono uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-bold text-fg">
                <AnimatedCounter end={data.total_users} />
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fill1/70 backdrop-blur-sm border-border shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-info/10 border border-info/20">
              <GitBranch className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-xs text-fg-secondary font-mono uppercase tracking-wider">Repos Scanned</p>
              <p className="text-2xl font-bold text-fg">
                <AnimatedCounter end={data.total_repos_scanned} />
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fill1/70 backdrop-blur-sm border-border shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-error/10 border border-error/20">
              <Bug className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-fg-secondary font-mono uppercase tracking-wider">Bugs Detected</p>
              <p className="text-2xl font-bold text-fg">
                <AnimatedCounter end={data.total_bugs_detected} />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current user callout */}
      {currentUserRank && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-accent/40 to-fill1 border border-primary/20 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
          <span className="text-lg">🎯</span>
          <span className="text-sm text-fg">
            You are ranked <strong className="text-primary-text">#{currentUserRank}</strong> on the leaderboard!
          </span>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="animate-in slide-in-from-bottom-6 duration-700">
        <div className="flex items-center gap-2 mb-5">
          <Crown className="w-5 h-5 text-amber" />
          <h2 className="heading-6 text-fg">Top Bug Hunters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {topThree[0] && <PodiumCard entry={topThree[0]} position={1} />}
          {topThree[1] && <PodiumCard entry={topThree[1]} position={2} />}
          {topThree[2] && <PodiumCard entry={topThree[2]} position={3} />}
        </div>
      </div>

      {/* Full Ranking Table */}
      {remaining.length > 0 && (
        <Card className="border-border shadow-lg p-0 overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
          {/* Table header */}
          <div className="flex justify-between items-center px-5 py-3 bg-fill2 border-b border-border text-xs font-mono text-fg-secondary">
            <span className="flex items-center gap-2">
              All Rankings
            </span>
            <span className="px-2.5 py-1 bg-fill3 rounded-md border border-soft shadow-inner">
              {data.entries.length} users
            </span>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="text-xs font-mono uppercase tracking-wider w-16">Rank</TableHead>
                <TableHead className="text-xs font-mono uppercase tracking-wider">User</TableHead>
                <TableHead className="text-center text-xs font-mono uppercase tracking-wider">Repos</TableHead>
                <TableHead className="text-center text-xs font-mono uppercase tracking-wider">Scans</TableHead>
                <TableHead className="text-center text-xs font-mono uppercase tracking-wider">Commits</TableHead>
                <TableHead className="text-center text-xs font-mono uppercase tracking-wider">Bugs Found</TableHead>
                <TableHead className="text-right text-xs font-mono uppercase tracking-wider hidden sm:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.entries.map((entry, i) => {
                const isCurrentUser = user && entry.full_name === user.full_name
                return (
                  <TableRow
                    key={entry.rank}
                    className={isCurrentUser ? 'bg-primary-accent/20 ring-2 ring-inset ring-primary/20 border-b-0' : ' border-border'}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <TableCell>
                      <RankBadge rank={entry.rank} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                          ${entry.rank <= 3
                            ? 'bg-gradient-to-br from-amber/80 to-amber-accent text-amber-text'
                            : 'bg-fill3 border border-border text-fg-secondary'
                          }
                        `}>
                          {entry.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium text-sm truncate ${isCurrentUser ? 'text-primary-text' : 'text-fg'}`}>
                            {entry.full_name}
                            {isCurrentUser && <span className="ml-1.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">YOU</span>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-info/10 text-info-text text-xs font-semibold">
                        <GitBranch className="w-3 h-3" />
                        {entry.repos_checked}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-fg-secondary font-mono text-xs">
                      {entry.total_scans}
                    </TableCell>
                    <TableCell className="text-center text-fg font-mono text-xs font-medium">
                      {entry.total_commits_analyzed.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold
                        ${entry.bugs_found > 0 ? 'bg-error/10 text-error-text' : 'bg-fill3 text-fg-tertiary'}
                      `}>
                        <Bug className="w-3 h-3" />
                        {entry.bugs_found}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-fg-tertiary text-xs font-mono hidden sm:table-cell">
                      {entry.joined_at ? new Date(entry.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
