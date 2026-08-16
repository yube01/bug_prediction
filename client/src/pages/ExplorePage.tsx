import { predictBatch } from "@/api"
import { saveSearch } from "@/api/auth"
import { fetchAuthorBugCounts, fetchBranches, fetchCommitDetails, fetchCommits, parseRepo } from "@/api/github"
import RateLimitBar from "@/components/website/explore/RateLimitBar"
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
import { Card, CardContent } from "@/components/ui/card"
import SearchHistory from "@/components/website/explore/SearchHistory"



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

    // const handleReSearch = useCallback((repoName: string) => {
    //     handleLoad(repoName)
    // }, [handleLoad])

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
        <div className="max-w-7xl mx-auto p-6 flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Header row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="heading-2 bg-clip-text text-transparent bg-gradient-to-r from-fg to-fg-secondary">Commit Explorer</h1>
                    <p className="text-sm text-fg-secondary mt-1">Analyze repository commits for potential bug risks.</p>
                </div>
                <div>
                    <RateLimitBar />
                </div>
            </div>

            {/* Input card */}
            <Card className="shadow-sm border-border bg-fill1/50 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <RepoInput onLoad={handleLoad} loading={loading} />
                    </div>
                    <div className="flex-1 w-full md:max-w-xs">
                        <BranchSelect
                            branches={branches}
                            currentBranch={currentBranch}
                            onChange={handleBranchChange}
                            loading={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <div className="px-4 py-3 rounded-lg bg-error/10 text-error border border-error/20 flex items-center gap-2 shadow-sm">
                    <span className="text-lg">❌</span>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {predictionError && !error && (
                <div className="px-4 py-3 rounded-lg bg-warning/10 text-warning border border-warning/20 text-sm flex items-center gap-2 shadow-sm">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium">Commits loaded, but model predictions failed: {predictionError}</span>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center gap-3 py-12 text-primary font-mono text-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    Fetching commits...
                </div>
            )}

            {/* Stats */}
            {!loading && stats && (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <StatCards stats={stats} branch={currentBranch} repoName={repo.split('/')[1]} />
                </div>
            )}

            {/* Commit list */}
            {!loading && commits.length > 0 && (
                <Card className="border-border shadow-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-center px-5 py-3 bg-fill2 border-b border-border text-xs font-mono text-fg-secondary">
                        <span>
                            Showing <strong className="text-fg font-medium">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, commits.length)}</strong> of <strong className="text-fg font-medium">{commits.length}</strong> commits
                        </span>
                        <span className="px-2.5 py-1 bg-fill3 rounded-md border border-soft shadow-inner">
                            Page {page} of {totalPages}
                        </span>
                    </div>

                    <div className="divide-y divide-soft">
                        {paginated.map(c => (
                            <CommitRow key={c.sha} commit={c} repo={repo} />
                        ))}
                    </div>

                    <div className="p-4 bg-fill1/30">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                </Card>
            )}
        </div>
    )
}

export default CommitExplorer