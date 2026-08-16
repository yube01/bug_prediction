import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getSearchHistory, deleteSearchEntry, type SearchHistoryItem } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Trash } from 'lucide-react'

interface Props {
  onReSearch: (repoName: string, branch: string) => void
}

export default function SearchHistory({ onReSearch }: Props) {
  const { token } = useAuth()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

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

  if (!token) return null
  if (!loading && history.length === 0) return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold">
          Recent Searches (0)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-3">
        <div className="text-fg-secondary text-sm font-mono py-2">No search history found.</div>
      </CardContent>
    </Card>
  )

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold">
          Recent Searches {loading ? '...' : `(${history.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center gap-2 text-fg-secondary text-sm font-mono py-2">
             <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
             Loading history...
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-fill1/50 border border-soft hover:border-primary/50 transition-colors">
              <div 
                className="flex-1 cursor-pointer" 
                onClick={() => onReSearch(item.repo_name, item.branch)}
                title={`Re-search ${item.repo_name}`}
              >
                <div className="text-fg font-mono text-sm font-bold">{item.repo_name}</div>
                <div className="text-fg-secondary font-mono text-xs mt-1">
                  {item.branch} <span className="opacity-50">·</span> {item.total_commits} commits
                </div>
              </div>

              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-md border-error/20 text-error hover:bg-error/10 hover:text-error hover:border-error/40 transition-colors flex-shrink-0"
                onClick={() => handleDelete(item.id)}
                title="Remove from history"
              >
                <Trash size={14} />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
