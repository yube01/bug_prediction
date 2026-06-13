import type {
  CommitFeatures,
  PredictionResponse,
  BatchResponse,
  HealthResponse,
  ModelInfoResponse,
} from './types'

const MODEL_API_URL = 'https://yube08-bug-prediction-system-v1.hf.space'
const BASE = (
  (import.meta as ImportMeta & { env?: { VITE_MODEL_API_URL?: string } }).env?.VITE_MODEL_API_URL
  ?? MODEL_API_URL
).replace(/\/$/, '')

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: string }
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const predictCommit = (data: CommitFeatures) =>
  req<PredictionResponse>(`${BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const predictBatch = (commits: CommitFeatures[]) =>
  req<BatchResponse>(`${BASE}/predict/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commits }),
  })

export const getHealth    = () => req<HealthResponse>(`${BASE}/health`)
export const getModelInfo = () => req<ModelInfoResponse>(`${BASE}/model/info`)
