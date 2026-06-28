import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, Link, useLocation, useSearchParams } from 'react-router-dom'
import type { GithubCommit, GithubBranch, RepoStats } from './types'
import { predictBatch } from './api'
import { fetchBranches, fetchCommitDetails, fetchCommits, fetchAuthorBugCounts, parseRepo } from './api/github'
import { saveSearch } from './api/auth'
import { buildCommitFeatures } from './utils/modelFeatures'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SignInPage  from './pages/SignInPage'
import SignUpPage  from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import PredictPage from './pages/PredictPage'
import ModelPage from './pages/ModelPage'
import RepoInput    from './components/website/RepoInput'
import BranchSelect from './components/website/BranchSelect'
import StatCards    from './components/website/StatCards'
import CommitRow    from './components/website/CommitRow'
import Pagination   from './components/website/Pagination'
import RateLimitBar from './components/website/RateLimitBar'
import SearchHistory from './components/website/SearchHistory'

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

/* ─── Navbar ───────────────────────────────────────────── */
function Navbar() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  
  return (
    <nav className="app-navbar">
      <div className="navbar-left">
        <div className="navbar-logo">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="navbar-brand">Bug Predictor</span>
        </div>
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Explorer
          </Link>
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/predict" className={`nav-link ${location.pathname === '/predict' ? 'active' : ''}`}>
            Predict
          </Link>
          <Link to="/model" className={`nav-link ${location.pathname === '/model' ? 'active' : ''}`}>
            Model Info
          </Link>
        </div>
      </div>
      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <span className="navbar-email">{user?.email}</span>
        </div>
        <button className="navbar-signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </nav>
  )
}

/* ─── Commit Explorer (main explorer page) ────────────── */
function CommitExplorer() {
  const { token } = useAuth()
  const [searchParams] = useSearchParams()
  const urlRepo = searchParams.get('repo')
  const urlBranch = searchParams.get('branch')
  const [initialSearchDone, setInitialSearchDone] = useState(false)

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

    let riskCounts = { high: 0, medium: 0, low: 0 }

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
        let authorBugCounts: Map<string, number> | undefined
        try {
          authorBugCounts = await fetchAuthorBugCounts(repoName, detailed)
        } catch {
          // Non-critical
        }

        const features = buildCommitFeatures(detailed, authorBugCounts)
        const batch = await predictBatch(features)
        const withPredictions = detailed.map((commit, i) => ({
          ...commit,
          prediction: batch.predictions[i],
        }))
        setCommits(withPredictions)

        riskCounts = {
          high: batch.high_risk,
          medium: batch.medium_risk,
          low: batch.low_risk,
        }
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

      // Auto-save search to DB (best-effort)
      if (token) {
        saveSearch(token, {
          repo_name: repoName,
          branch,
          total_commits: detailed.length,
          high_risk_count: riskCounts.high,
          medium_risk_count: riskCounts.medium,
          low_risk_count: riskCounts.low,
        }).then(() => {
          // Refresh search history panel
          if ((SearchHistory as any).__refresh) {
            (SearchHistory as any).__refresh()
          }
        }).catch(() => { /* non-critical */ })
      }
    } catch (e) {
      setError((e as Error).message)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [token])

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

  const handleReSearch = useCallback((repoName: string) => {
    handleLoad(repoName)
  }, [handleLoad])

  useEffect(() => {
    if (urlRepo && !initialSearchDone) {
      setInitialSearchDone(true)
      const repoName = parseRepo(urlRepo)
      if (repoName) {
        setRepo(repoName)
        setLoading(true)
        setError(null)
        fetchBranches(repoName).then(async (branchList) => {
          setBranches(branchList)
          const targetBranch = urlBranch || (
            branchList.find(b => b.name === 'main')?.name ??
            branchList.find(b => b.name === 'master')?.name ??
            branchList[0]?.name ?? 'main'
          )
          setCurrentBranch(targetBranch)
          await loadCommits(repoName, targetBranch)
        }).catch((e) => {
          setError((e as Error).message)
          setStatus('error')
          setLoading(false)
        })
      }
    }
  }, [urlRepo, urlBranch, initialSearchDone, loadCommits])

  const paginated  = commits.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(commits.length / PER_PAGE)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-mono)' }}>

      {/* Header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: '0.25rem' }}>
            Commit explorer
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>
            Enter a public GitHub repo to browse commits with bug risk indicators.
          </p>
        </div>

        {/* Rate limit indicator — top right */}
        <div style={{ flexShrink: 0, marginTop: 4 }}>
          <RateLimitBar />
        </div>
      </div>

      {/* Search History */}
      <SearchHistory onReSearch={handleReSearch} />

      {/* Input card */}
      <div style={{
        background: 'var(--bg2)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)',
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
          borderRadius: 'var(--r2)',
          background: 'rgba(240,58,79,0.12)', color: '#f06070',
          border: '0.5px solid rgba(240,58,79,0.25)',
          fontSize: 13, marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {predictionError && !error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--r2)',
          background: 'rgba(245,168,0,0.12)', color: '#f5a800',
          border: '0.5px solid rgba(245,168,0,0.25)',
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
          color: 'var(--text2)', fontSize: 13,
        }}>
          <div style={{
            width: 20, height: 20,
            border: '2px solid var(--border2)',
            borderTopColor: 'var(--accent)',
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
          background: 'var(--bg2)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--r)',
          padding: '0 1.25rem',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 0',
            borderBottom: '0.5px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, commits.length)} of {commits.length} commits
            </span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
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

/* ─── App Router ──────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <CommitExplorer />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <DashboardPage />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/predict"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-mono)' }}>
                <PredictPage />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/model"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-mono)' }}>
                <ModelPage />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
