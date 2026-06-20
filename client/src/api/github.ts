import type { GithubCommit, GithubBranch, RateLimitInfo } from '../types'
const TOKEN = (import.meta as ImportMeta & { env?: { VITE_GITHUB_TOKEN?: string } }).env?.VITE_GITHUB_TOKEN

const BASE = 'https://api.github.com'
const HEADERS: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
}
let rateLimitListeners: ((info: RateLimitInfo) => void)[] = []

export function onRateLimitUpdate(cb: (info: RateLimitInfo) => void) {
    rateLimitListeners.push(cb)
    return () => { rateLimitListeners = rateLimitListeners.filter(l => l !== cb) }
}

function extractRateLimit(res: Response): void {
    const remaining = res.headers.get('X-RateLimit-Remaining')
    const limit = res.headers.get('X-RateLimit-Limit')
    const reset = res.headers.get('X-RateLimit-Reset')
    if (remaining && limit && reset) {
        const info: RateLimitInfo = {
            remaining: parseInt(remaining),
            limit: parseInt(limit),
            resetAt: new Date(parseInt(reset) * 1000),
        }
        rateLimitListeners.forEach(cb => cb(info))
    }
}

async function get<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: HEADERS })
    extractRateLimit(res)
    if (res.status === 404) throw new Error('Repository not found')
    if (res.status === 403) throw new Error('GitHub rate limit hit — resets at ' + new Date(parseInt(res.headers.get('X-RateLimit-Reset') ?? '0') * 1000).toLocaleTimeString())
    if (res.status === 401) throw new Error('Unauthorized — check your token')
    if (!res.ok) throw new Error(`GitHub error ${res.status}`)
    return res.json() as Promise<T>
}

export async function fetchBranches(repo: string): Promise<GithubBranch[]> {
    return get<GithubBranch[]>(`${BASE}/repos/${repo}/branches?per_page=100`)
}

export async function fetchCommits(
    repo: string,
    branch: string,
    page = 1,
    perPage = 100,
): Promise<GithubCommit[]> {
    return get<GithubCommit[]>(
        `${BASE}/repos/${repo}/commits?sha=${branch}&per_page=${perPage}&page=${page}`
    )
}

export async function fetchCommitDetails(repo: string, sha: string): Promise<GithubCommit> {
    return get<GithubCommit>(`${BASE}/repos/${repo}/commits/${sha}`)
}

export async function fetchRateLimit(): Promise<RateLimitInfo> {
    const res = await fetch(`${BASE}/rate_limit`, { headers: HEADERS })
    const data = await res.json() as { rate: { remaining: number; limit: number; reset: number } }
    const info = {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        resetAt: new Date(data.rate.reset * 1000),
    }
    rateLimitListeners.forEach(cb => cb(info))
    return info
}

export function parseRepo(input: string): string | null {
    const cleaned = input.trim()
        .replace(/^https?:\/\/github\.com\//, '')
        .replace(/\/$/, '')
    const match = cleaned.match(/^[\w.-]+\/[\w.-]+/)
    return match ? match[0] : null
}

// ── Full-history author bug counts ──────────────────────────────────────────
// Fetches each unique author's commit history across the entire repo (up to 100
// most recent commits per author) and counts how many contain bug-related keywords.
// This is dramatically more accurate than only counting within the loaded batch.

const BUG_WORDS = /\b(bug|fix|fixed|hotfix|patch|defect|regression|issue)\b/i

/**
 * For each unique author in the commit list, fetch their full commit history
 * from the GitHub API and count bug-related commits.
 *
 * Returns Map<authorEmail, bugFixCount> for use in prior_bugs_author calculation.
 *
 * Rate-limit aware: limits to 15 unique authors max, uses Promise.allSettled
 * so individual failures don't break the whole batch.
 */
export async function fetchAuthorBugCounts(
    repo: string,
    commits: GithubCommit[],
): Promise<Map<string, number>> {
    // Deduplicate authors — prefer login for API query, key by email
    const authorMap = new Map<string, string>() // email → login or email (for API query)
    for (const c of commits) {
        const key = c.commit.author.email || c.commit.author.name
        if (!authorMap.has(key)) {
            // Use GitHub login if available (more reliable for API queries)
            const queryParam = c.author?.login || c.commit.author.email
            authorMap.set(key, queryParam)
        }
    }

    // Cap at 15 authors to respect rate limits
    const entries = Array.from(authorMap.entries()).slice(0, 15)
    const counts = new Map<string, number>()

    const results = await Promise.allSettled(
        entries.map(async ([authorKey, queryParam]) => {
            try {
                const authorCommits = await get<{ commit: { message: string } }[]>(
                    `${BASE}/repos/${repo}/commits?author=${encodeURIComponent(queryParam)}&per_page=100`
                )
                const bugCount = authorCommits.filter(c => BUG_WORDS.test(c.commit.message)).length
                counts.set(authorKey, bugCount)
            } catch {
                // Rate limited or error — this author will fall back to batch counting
            }
        })
    )

    return counts
}
