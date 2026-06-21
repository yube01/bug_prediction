import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSearchHistory, deleteSearchEntry, type SearchHistoryItem } from '../../api/auth'

interface Props {
  onReSearch: (repoName: string) => void
}

export default function SearchHistory({ onReSearch }: Props) {
  const { token } = useAuth()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const items = await getSearchHistory(token)
      setHistory(items)
    } catch {
      // non-critical
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  // Expose refresh so parent can call after saving
  ;(SearchHistory as any).__refresh = load

  const handleDelete = async (id: string) => {
    if (!token) return
    try {
      await deleteSearchEntry(token, id)
      setHistory(h => h.filter(item => item.id !== id))
    } catch { /* ignore */ }
  }

  if (!token || history.length === 0) return null

  return (
    <div className="search-history-panel">
      <button
        className="search-history-toggle"
        onClick={() => setExpanded(v => !v)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
          <path d="M8 1v6.586L12.293 12 13 11.293 8 6.293 3 11.293 3.707 12 8 7.586V15" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
        <span>Recent searches ({history.length})</span>
        <span style={{
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontSize: 11,
        }}>▼</span>
      </button>

      {expanded && (
        <div className="search-history-list">
          {loading ? (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>
              Loading…
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="search-history-item">
                <button
                  className="search-history-repo"
                  onClick={() => onReSearch(item.repo_name)}
                  title={`Re-search ${item.repo_name}`}
                >
                  <span className="search-history-name">{item.repo_name}</span>
                  <span className="search-history-meta">
                    {item.branch} · {item.total_commits} commits
                  </span>
                </button>

                <div className="search-history-risks">
                  {item.high_risk_count > 0 && (
                    <span className="risk-dot risk-high">{item.high_risk_count}</span>
                  )}
                  {item.medium_risk_count > 0 && (
                    <span className="risk-dot risk-med">{item.medium_risk_count}</span>
                  )}
                  {item.low_risk_count > 0 && (
                    <span className="risk-dot risk-low">{item.low_risk_count}</span>
                  )}
                </div>

                <button
                  className="search-history-delete"
                  onClick={() => handleDelete(item.id)}
                  title="Remove from history"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
