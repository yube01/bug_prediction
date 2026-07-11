import { predictBatch } from "@/api"
import { saveSearch } from "@/api/auth"
import { fetchAuthorBugCounts, fetchBranches, fetchCommitDetails, fetchCommits, parseRepo } from "@/api/github"
import RateLimitBar from "@/components/website/explore/RateLimitBar"
import SearchHistory from "@/components/website/explore/SearchHistory"
import RepoInput from "@/components/website/explore/RepoInput"
import BranchSelect from "@/components/website/explore/BranchSelect"
import StatCards from "@/components/website/explore/StatCards"
import CommitRow from "@/components/website/explore/CommitRow"
import Pagination from "@/components/website/explore/Pagination"
import { useAuth } from "@/context/AuthContext"
import { GithubBranch, GithubCommit, RepoStats } from "@/types"
import { buildCommitFeatures } from "@/utils/modelFeatures"
import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"



const PER_PAGE = 20
type SearchHistoryWithRefresh = {
    __refresh?: () => void
}

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

const CommitExplorer = () => {
    const { token } = useAuth()
    const [searchParams] = useSearchParams()
    const urlRepo = searchParams.get('repo')
    const urlBranch = searchParams.get('branch')
    const [initialSearchDone, setInitialSearchDone] = useState(false)

    const [repo, setRepo] = useState('')
    const [branches, setBranches] = useState<GithubBranch[]>([])
    const [currentBranch, setCurrentBranch] = useState('')
    const [commits, setCommits] = useState<GithubCommit[]>([])
    const [stats, setStats] = useState<RepoStats | null>(null)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
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

            const dates = detailed.map(c => new Date(c.commit.author.date).getTime())
            const newest = Math.max(...dates)
            const oldest = Math.min(...dates)
            const authors = new Set(detailed.map(c => c.commit.author.email)).size
            setStats({
                totalCommits: detailed.length,
                contributors: authors,
                spanDays: Math.max(1, Math.round((newest - oldest) / 86400000)),
                oldestDate: new Date(oldest).toISOString(),
                newestDate: new Date(newest).toISOString(),
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
                    const searchHistory = SearchHistory as unknown as SearchHistoryWithRefresh
                    if (searchHistory.__refresh) {
                        searchHistory.__refresh()
                    }
                }).catch(() => { /* non-critical */ })
            }
        } catch (e) {
            setError((e as Error).message)
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
                    setLoading(false)
                })
            }
        }
    }, [urlRepo, urlBranch, initialSearchDone, loadCommits])

    const paginated = commits.slice((page - 1) * PER_PAGE, page * PER_PAGE)
    const totalPages = Math.ceil(commits.length / PER_PAGE)

    return (
        <div className="p-4 flex gap-6 flex-col">
            {/* Header row */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 > Commit explore   </h1>
                    <p >   Enter a public GitHub repo to browse commits with bug risk indicators. </p>
                </div>
                <div>
                    <RateLimitBar />
                </div>
            </div>

            {/* Search History */}
            <SearchHistory onReSearch={handleReSearch} />

            {/* Input card */}
            <div className="flex gap-2  flex-col w-full">
                <RepoInput onLoad={handleLoad} loading={loading} />
                <BranchSelect
                    branches={branches}
                    currentBranch={currentBranch}
                    onChange={handleBranchChange}
                    loading={loading}
                />
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 py-3 rounded-sm bg-fill1 text-errror-text border border-soft mb-4">
                    {error}
                </div>
            )}

            {predictionError && !error && (
                <div className="px-4 py-3 rounded-sm bg-fill1 text-warning-text border border-soft text-[13px] mb-4">
                    Commits loaded, but model predictions failed: {predictionError}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center gap-2.5 p-10 text-text2 text-[13px]">
                    <div className="w-5 h-5 rounded-full border-2 border-border2 border-t-accent animate-spin" />
                    Fetching commits...
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
                <div className="bg-elevation-level2 border border-soft rounded-sm p-1">
                    <div className=" flex justify-between items-center p-1 border-b border-soft" >
                        <span >
                            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, commits.length)} of {commits.length} commits
                        </span>
                        <span>
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

export default CommitExplorer