import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSearchHistory, deleteSearchEntry, type SearchHistoryItem } from '../api/auth'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function DashboardPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtering and Sorting States
  const [filterText, setFilterText] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'commits' | 'high_risk'>('date')

  const fetchHistory = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await getSearchHistory(token)
      setHistory(data)
    } catch {
      setError('Failed to fetch search history')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleDelete = async (id: string) => {
    if (!token) return
    if (!confirm('Are you sure you want to remove this repository from your history?')) return
    try {
      await deleteSearchEntry(token, id)
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch {
      alert('Failed to delete search entry')
    }
  }

  // Aggregate stats across ALL search history (deduplicated by latest search per repo)
  const uniqueRepos = useMemo(() => {
    const map = new Map<string, SearchHistoryItem>()
    // Since history is returned newest first, the first one we see is the latest search
    history.forEach(item => {
      if (!map.has(item.repo_name)) {
        map.set(item.repo_name, item)
      }
    })
    return Array.from(map.values())
  }, [history])

  const stats = useMemo(() => {
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

    // Find most risky repo (by high risk ratio)
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
  }, [uniqueRepos])

  // Filtered and Sorted list for the table
  const filteredAndSortedRepos = useMemo(() => {
    return uniqueRepos
      .filter(r => r.repo_name.toLowerCase().includes(filterText.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.repo_name.localeCompare(b.repo_name)
        }
        if (sortBy === 'commits') {
          return b.total_commits - a.total_commits
        }
        if (sortBy === 'high_risk') {
          return b.high_risk_count - a.high_risk_count
        }
        return new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime()
      })
  }, [uniqueRepos, filterText, sortBy])

  // Chart data 1: Risk Distribution (Donut Chart)
  const donutData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'Low Risk', value: stats.totalLowRisk, color: '#00c97a' },
      { name: 'Medium Risk', value: stats.totalMediumRisk, color: '#f5a800' },
      { name: 'High Risk', value: stats.totalHighRisk, color: '#f03a4f' },
    ].filter(d => d.value > 0)
  }, [stats])

  // Chart data 2: Repository Comparison (Stacked Bar Chart for Top 6 Repos)
  const barData = useMemo(() => {
    return uniqueRepos
      .slice(0, 6)
      .map(r => ({
        name: r.repo_name.split('/')[1] || r.repo_name,
        fullName: r.repo_name,
        'Low Risk': r.low_risk_count,
        'Medium Risk': r.medium_risk_count,
        'High Risk': r.high_risk_count,
      }))
  }, [uniqueRepos])

  const handleExploreRepo = (repoName: string, branch: string) => {
    navigate(`/?repo=${encodeURIComponent(repoName)}&branch=${encodeURIComponent(branch)}`)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text2)' }}>
        <div style={{
          width: 28, height: 28, border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', margin: '0 auto 16px',
        }} />
        Fetching analysis data...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: 20, borderRadius: 'var(--r)', margin: '2rem 0',
        background: 'rgba(240,58,79,0.08)',
        border: '1px solid rgba(240,58,79,0.25)', color: '#f03a4f',
        fontFamily: 'var(--font-mono)', fontSize: 13,
      }}>
        ❌ {error} — Make sure the backend server is running on localhost:8000.
      </div>
    )
  }

  if (history.length === 0 || !stats) {
    return (
      <div style={{
        maxWidth: 700, margin: '4rem auto', padding: '3rem 2rem',
        textAlign: 'center', background: 'var(--bg2)',
        border: '1px solid var(--border)', borderRadius: 'var(--r)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          fontSize: 48, marginBottom: '1.5rem',
          filter: 'drop-shadow(0 0 10px rgba(91,82,232,0.3))'
        }}>📊</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: '0.75rem' }}>
          No Repositories Analyzed Yet
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
          Analyze your first repository to unlock comprehensive risk management dashboards, performance aggregates, and repository comparisons.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 28px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: '#fff', border: 'none', borderRadius: 'var(--r2)',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(91,82,232,0.4)',
          }}
        >
          [ ANALYZE A REPOSITORY ]
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-mono)' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(90deg, #fff, var(--text2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Analytics Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', maxWidth: 600, lineHeight: 1.5 }}>
          Aggregate analysis of all historical searches. Diffs, complexities, and developer metrics gathered from your public GitHub repository requests.
        </p>
      </div>

      {/* Aggregate Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: '2rem'
      }}>
        {/* Card 1 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Repos Analyzed
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Mono', color: 'var(--accent2)' }}>
            {stats.totalRepos}
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Total Commits
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Mono', color: 'var(--text)' }}>
            {stats.totalCommits}
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px', borderLeft: '3px solid #f03a4f', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            High Risk Commits
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Space Mono', color: '#f03a4f' }}>
              {stats.totalHighRisk}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text2)', opacity: 0.8 }}>
              ({stats.overallRiskRate}% rate)
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Most Risky Repo
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f5a800', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 4 }} title={stats.mostRiskyRepoFull}>
            {stats.mostRiskyRepo}
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20,
        marginBottom: '2rem'
      }}>
        {/* Donut Chart: Risk Distribution */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 20 }}>
          <h3 style={{ fontSize: 12, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
            Overall Risk Profile Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 220, justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', maxWidth: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'rgba(13, 13, 26, 0.95)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: '#fff', fontSize: 11, fontFamily: 'Space Mono' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend info */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
              {donutData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ color: 'var(--text2)' }}>{d.name}:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'Space Mono' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stacked Bar Chart: Repository Comparison */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 20 }}>
          <h3 style={{ fontSize: 12, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 15, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
            Compare Top Repositories
          </h3>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 10, fontFamily: 'Space Mono' }} stroke="var(--border)" />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 10, fontFamily: 'Space Mono' }} stroke="var(--border)" />
                <Tooltip
                  contentStyle={{ background: 'rgba(13, 13, 26, 0.95)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: '#fff', fontSize: 11 }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--accent)' }}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10, fontFamily: 'Space Mono' }} />
                <Bar dataKey="Low Risk" stackId="a" fill="#00c97a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Medium Risk" stackId="a" fill="#f5a800" radius={[0, 0, 0, 0]} />
                <Bar dataKey="High Risk" stackId="a" fill="#f03a4f" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History List Section */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 15, marginBottom: 15 }}>
          <h3 style={{ fontSize: 13, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, fontFamily: 'Syne, sans-serif', margin: 0 }}>
            Searched Repositories ({uniqueRepos.length})
          </h3>
          
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Filter repositories..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 10px',
                color: 'var(--text)',
                fontSize: 11,
                fontFamily: 'Space Mono',
                width: 170,
                outline: 'none',
              }}
            />

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSortBy(e.target.value as 'date' | 'name' | 'commits' | 'high_risk')
              }
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '5px 10px',
                color: 'var(--text2)',
                fontSize: 11,
                fontFamily: 'Space Mono',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="date">Date Analyzed</option>
              <option value="name">Repo Name</option>
              <option value="commits">Total Commits</option>
              <option value="high_risk">High Risk Commits</option>
            </select>
          </div>
        </div>

        {/* Repository Table */}
        <div style={{ overflowX: 'auto' }}>
          {filteredAndSortedRepos.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>
              No repositories match your filter query.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                  <th style={{ padding: '10px 8px', fontWeight: 500 }}>Repository Name</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500 }}>Branch</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500, width: 80 }}>Commits</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500 }}>Risk Level Breakdown</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500, width: 110 }}>Analyzed At</th>
                  <th style={{ padding: '10px 8px', fontWeight: 500, width: 160, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRepos.map((item) => {
                  const total = item.high_risk_count + item.medium_risk_count + item.low_risk_count
                  const highPct = total > 0 ? (item.high_risk_count / total) * 100 : 0
                  const medPct = total > 0 ? (item.medium_risk_count / total) * 100 : 0
                  const lowPct = total > 0 ? (item.low_risk_count / total) * 100 : 0

                  return (
                    <tr key={item.id} className="repo-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text)' }}>
                        {item.repo_name}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text2)', fontFamily: 'Space Mono', fontSize: 11 }}>
                        {item.branch}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 500, fontFamily: 'Space Mono' }}>
                        {item.total_commits}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {total > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Visual stacked indicator */}
                            <div style={{ display: 'flex', width: 140, height: 7, borderRadius: 3, overflow: 'hidden', background: 'var(--border)' }}>
                              {lowPct > 0 && <div style={{ width: `${lowPct}%`, background: '#00c97a' }} title={`Low Risk: ${item.low_risk_count}`} />}
                              {medPct > 0 && <div style={{ width: `${medPct}%`, background: '#f5a800' }} title={`Medium Risk: ${item.medium_risk_count}`} />}
                              {highPct > 0 && <div style={{ width: `${highPct}%`, background: '#f03a4f' }} title={`High Risk: ${item.high_risk_count}`} />}
                            </div>
                            {/* Numeric summary */}
                            <div style={{ display: 'flex', gap: 6, fontSize: 9, fontFamily: 'Space Mono', color: 'var(--text2)' }}>
                              <span style={{ color: '#00c97a' }}>{item.low_risk_count}L</span>
                              <span style={{ color: '#f5a800' }}>{item.medium_risk_count}M</span>
                              <span style={{ color: '#f03a4f' }}>{item.high_risk_count}H</span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--text2)' }}>No commit details</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text2)', fontSize: 11 }}>
                        {new Date(item.searched_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleExploreRepo(item.repo_name, item.branch)}
                            style={{
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontSize: 10,
                              fontWeight: 600,
                              color: 'var(--accent2)',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            className="btn-explore-hover"
                          >
                            Explore
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              background: 'none',
                              border: '1px solid rgba(240, 58, 79, 0.2)',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: 10,
                              fontWeight: 500,
                              color: '#f03a4f',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            className="btn-delete-hover"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        .repo-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.015);
        }
        .btn-explore-hover:hover {
          background-color: rgba(91, 82, 232, 0.12) !important;
          border-color: var(--accent) !important;
          color: var(--accent2) !important;
        }
        .btn-delete-hover:hover {
          background-color: rgba(240, 58, 79, 0.08) !important;
          border-color: #f03a4f !important;
        }
      `}</style>
    </div>
  )
}
