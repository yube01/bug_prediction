/**
 * Auth + Search History API calls to the FastAPI backend.
 */

const SERVER_URL = (
  (import.meta as ImportMeta & { env?: { VITE_SERVER_URL?: string } }).env?.VITE_SERVER_URL
  ?? 'http://localhost:8000'
).replace(/\/$/, '')

// ── Types ──────────────────────────────────────────────────
export interface AuthUser {
  id: string
  full_name: string
  email: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface SearchHistoryItem {
  id: string
  repo_name: string
  branch: string
  total_commits: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  searched_at: string
}

// ── Helpers ─────────────────────────────────────────────────
async function authRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string }
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

// ── Auth endpoints ──────────────────────────────────────────
export async function signUp(
  full_name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return authRequest<AuthResponse>(`${SERVER_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password }),
  })
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return authRequest<AuthResponse>(`${SERVER_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function getMe(token: string): Promise<AuthUser> {
  return authRequest<AuthUser>(`${SERVER_URL}/auth/me`, {
    headers: authHeaders(token),
  })
}

// ── Search History endpoints ────────────────────────────────
export async function saveSearch(
  token: string,
  data: {
    repo_name: string
    branch: string
    total_commits: number
    high_risk_count: number
    medium_risk_count: number
    low_risk_count: number
  },
): Promise<{ id: string; message: string }> {
  return authRequest(`${SERVER_URL}/search/save`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
}

export async function getSearchHistory(
  token: string,
): Promise<SearchHistoryItem[]> {
  return authRequest<SearchHistoryItem[]>(`${SERVER_URL}/search/history`, {
    headers: authHeaders(token),
  })
}

export async function deleteSearchEntry(
  token: string,
  id: string,
): Promise<void> {
  await authRequest(`${SERVER_URL}/search/history/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}
