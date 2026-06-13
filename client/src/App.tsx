import { useState, useCallback } from 'react'
import type { GithubCommit, GithubBranch, RepoStats } from './types'
import { predictBatch } from './api'
import { fetchBranches, fetchCommitDetails, fetchCommits, parseRepo } from './api/github'
import { buildCommitFeatures } from './utils/modelFeatures'
import RepoInput    from './components/website/RepoInput'
import BranchSelect from './components/website/BranchSelect'
import StatCards    from './components/website/StatCards'
import CommitRow    from './components/website/CommitRow'
import Pagination   from './components/website/Pagination'
import RateLimitBar from './components/website/RateLimitBar'

const PER_PAGE = 20
type Status = 'idle' | 'ok' | 'error'

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await mapper(items[current])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  )

  return results
}

export default function App() {
  const [repo,          setRepo]          = useState('')
  const [branches,      setBranches]      = useState<GithubBranch[]>([])
  const [currentBranch, setCurrentBranch] = useState('')
  const [commits,       setCommits]       = useState<GithubCommit[]>([])
  const [stats,         setStats]         = useState<RepoStats | null>(null)
  const [page,          setPage]          = useState(1)
  const [loading,       setLoading]       = useState(false)
  const [status,        setStatus]        = useState<Status>('idle')
  const [error,         setError]         = useState<string | null>(null)
  const [predictionError, setPredictionError] = useState<string | null>(null)

  const loadCommits = useCallback(async (repoName: string, branch: string) => {
    setLoading(true)
    setError(null)
    setPredictionError(null)
    setCommits([])
    setStats(null)
    try {
      const page1 = await fetchCommits(repoName, branch, 1)
      let all = page1
      if (page1.length === 100) {
        const page2 = await fetchCommits(repoName, branch, 2).catch(() => [])
        all = [...page1, ...page2]
      }
      const detailed = await mapWithLimit(all, 8, commit =>
        fetchCommitDetails(repoName, commit.sha).catch(() => commit),
      )

      try {
        const features = buildCommitFeatures(detailed)
        const batch = await predictBatch(features)
        const withPredictions = detailed.map((commit, i) => ({
          ...commit,
          prediction: batch.predictions[i],
        }))
        setCommits(withPredictions)
      } catch (e) {
        setPredictionError((e as Error).message)
        setCommits(detailed)
      }

      setPage(1)
      setStatus('ok')

      const dates   = detailed.map(c => new Date(c.commit.author.date).getTime())
      const newest  = Math.max(...dates)
      const oldest  = Math.min(...dates)
      const authors = new Set(detailed.map(c => c.commit.author.email)).size
      setStats({
        totalCommits: detailed.length,
        contributors: authors,
        spanDays:     Math.max(1, Math.round((newest - oldest) / 86400000)),
        oldestDate:   new Date(oldest).toISOString(),
        newestDate:   new Date(newest).toISOString(),
      })
    } catch (e) {
      setError((e as Error).message)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLoad = useCallback(async (input: string) => {
    const repoName = parseRepo(input)
    if (!repoName) { setError('Enter a valid repo: owner/repo or paste the GitHub URL'); return }
    setLoading(true)
    setError(null)
    setRepo(repoName)
    setStatus('idle')
    try {
      const branchList = await fetchBranches(repoName)
      setBranches(branchList)
      const defaultBranch =
        branchList.find(b => b.name === 'main')?.name ??
        branchList.find(b => b.name === 'master')?.name ??
        branchList[0]?.name ?? 'main'
      setCurrentBranch(defaultBranch)
      await loadCommits(repoName, defaultBranch)
    } catch (e) {
      setError((e as Error).message)
      setStatus('error')
      setLoading(false)
    }
  }, [loadCommits])

  const handleBranchChange = useCallback(async (branch: string) => {
    setCurrentBranch(branch)
    await loadCommits(repo, branch)
  }, [repo, loadCommits])

  const paginated  = commits.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(commits.length / PER_PAGE)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-sans)' }}>

      {/* Header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: '0.25rem' }}>
            Commit explorer
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Enter a public GitHub repo to browse commits with bug risk indicators.
          </p>
        </div>

        {/* Rate limit indicator — top right */}
        <div style={{ flexShrink: 0, marginTop: 4 }}>
          <RateLimitBar />
        </div>
      </div>

      {/* Input card */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <RepoInput onLoad={handleLoad} loading={loading} />
        <BranchSelect
          branches={branches}
          currentBranch={currentBranch}
          onChange={handleBranchChange}
          loading={loading}
          status={status}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-md)',
          background: '#FCEBEB', color: '#A32D2D',
          border: '0.5px solid #F09595',
          fontSize: 13, marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {predictionError && !error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-md)',
          background: '#FAEEDA', color: '#854F0B',
          border: '0.5px solid #E7B85B',
          fontSize: 13, marginBottom: '1rem',
        }}>
          Commits loaded, but model predictions failed: {predictionError}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', gap: 10,
          padding: '2.5rem',
          color: 'var(--color-text-secondary)', fontSize: 13,
        }}>
          <div style={{
            width: 20, height: 20,
            border: '2px solid var(--color-border-tertiary)',
            borderTopColor: 'var(--color-text-secondary)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          Fetching commits…
        </div>
      )}

      {/* Stats */}
      {!loading && stats && (
        <div style={{ marginBottom: '1rem' }}>
          <StatCards stats={stats} branch={currentBranch} repoName={repo.split('/')[1]} />
        </div>
      )}

      {/* Commit list */}
      {!loading && commits.length > 0 && (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '0 1.25rem',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 0',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, commits.length)} of {commits.length} commits
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
          </div>

          {paginated.map(c => (
            <CommitRow key={c.sha} commit={c} repo={repo} />
          ))}

          <div style={{ padding: '1rem 0' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
