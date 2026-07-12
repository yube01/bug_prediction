import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSearchHistory, deleteSearchEntry, type SearchHistoryItem } from '../api/auth'

export function useSearchHistory() {
  const { token } = useAuth()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!token) return
      if (!confirm('Are you sure you want to remove this repository from your history?')) return
      try {
        await deleteSearchEntry(token, id)
        setHistory(prev => prev.filter(item => item.id !== id))
      } catch {
        alert('Failed to delete search entry')
      }
    },
    [token],
  )

  return { history, loading, error, deleteEntry, refetch: fetchHistory }
}