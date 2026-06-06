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