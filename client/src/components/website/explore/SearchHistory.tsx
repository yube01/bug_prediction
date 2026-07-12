import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getSearchHistory, deleteSearchEntry, type SearchHistoryItem } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'

interface Props {
  onReSearch: (repoName: string) => void
}

export default function SearchHistory({ onReSearch }: Props) {
  const { token } = useAuth()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

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
    ; (SearchHistory as unknown as { __refresh?: typeof load }).__refresh = load

  const handleDelete = async (id: string) => {
    if (!token) return
    try {
      await deleteSearchEntry(token, id)
      setHistory(h => h.filter(item => item.id !== id))
    } catch { /* ignore */ }
  }

  if (!token || history.length === 0) return null

  return (
    <div className="flex flex-col gap-2">

      <h1 className="heading-4">Recent searches ({history.length})</h1>

      <div  className="flex flex-col gap-2">
        {loading ? (
          <div>
            Loading…
          </div>
        ) : (
          history.map(item => (
            <div className=' flex gap-3 items-center' key={item.id} >
              <Button
                onClick={() => onReSearch(item.repo_name)}
                title={`Re-search ${item.repo_name}`}
              >
                <span >{item.repo_name}</span>
                <span>
                  {item.branch} · {item.total_commits} commits
                </span>
              </Button>

              {/* <div >
                <p>High Risk Count</p>
                {item.high_risk_count > 0 && (
                  <span>{item.high_risk_count}</span>
                )}
                {item.medium_risk_count > 0 && (
                  <span >{item.medium_risk_count}</span>
                )}
                {item.low_risk_count > 0 && (
                  <span>{item.low_risk_count}</span>
                )}
              </div> */}

              <Button
                color="error"
                className="search-history-delete"
                onClick={() => handleDelete(item.id)}
                title="Remove from history"
              >
                <Trash />
                Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
