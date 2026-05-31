import { useEffect, useState } from 'react'
import { getHealth } from './api'
import type { HealthResponse } from './types'
import PredictPage from './pages/PredictPage'
import ModelPage   from './pages/ModelPage'

type Page = 'predict' | 'model'

export default function App() {
  const [page,   setPage]   = useState<Page>('predict')
  const [health, setHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', model_loaded: false, version: '' }))
  }, [])

  const online     = health?.status === 'ok'
  const dotColor   = online ? '#00c97a' : '#f03a4f'
  const statusText = health ? (online ? 'API ONLINE' : 'API OFFLINE') : 'CHECKING...'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(91,82,232,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(91,82,232,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '36px 36px',
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(7,7,15,0.88)', backdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--border)', padding: '0 28px',
      }}>
        <div style={{
          maxWidth: 1160, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 28, height: 58,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, boxShadow: '0 4px 12px rgba(91,82,232,0.4)',
            }}>🐛</div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, letterSpacing: '0.02em' }}>
                BugPredict
              </div>
              <div style={{ fontSize: 8, color: '#44446a', letterSpacing: '0.12em' }}>
                CLZ RESEARCH
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 3, flex: 1 }}>
            {([
              { id: 'predict' as Page, label: '[ PREDICT ]' },
              { id: 'model'   as Page, label: '[ MODEL INFO ]' },
            ]).map(({ id, label }) => (
              <button key={id} onClick={() => setPage(id)} style={{
                padding: '7px 14px', borderRadius: 'var(--r2)',
                border: `1px solid ${page === id ? 'var(--accent)44' : 'transparent'}`,
                background: page === id ? 'rgba(91,82,232,0.1)' : 'transparent',
                color: page === id ? 'var(--accent2)' : 'var(--text2)',
                cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11,
                transition: 'all 0.2s',
              }}>
                {label}
              </button>
            ))}
          </nav>

          {/* Status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 12px', borderRadius: 999,
            background: online ? 'rgba(0,201,122,0.07)' : 'rgba(240,58,79,0.07)',
            border: `1px solid ${dotColor}30`,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: dotColor, boxShadow: `0 0 7px ${dotColor}`,
              animation: online ? 'pulse 2s ease infinite' : 'none',
            }} />
            <span style={{ fontSize: 9, color: dotColor, fontFamily: 'Space Mono', letterSpacing: '0.1em' }}>
              {statusText}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 28px 72px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 26 }}>
          {page === 'predict' ? (
            <>
              <div style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 7, fontFamily: 'Space Mono' }}>
                ▸ COMMIT ANALYSIS
              </div>
              <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, lineHeight: 1.2 }}>
                Predict Bug Risk
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: 7, fontSize: 12, maxWidth: 500 }}>
                Enter commit details to get a bug probability score — Random Forest trained on 16,722 real GitHub commits.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 7, fontFamily: 'Space Mono' }}>
                ▸ MODEL DETAILS
              </div>
              <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, lineHeight: 1.2 }}>
                Model Information
              </h1>
              <p style={{ color: 'var(--text2)', marginTop: 7, fontSize: 12, maxWidth: 500 }}>
                Performance metrics, features, and risk thresholds for the CLZ bug prediction model.
              </p>
            </>
          )}
        </div>

        <div key={page} style={{ animation: 'fadeUp 0.3s ease' }}>
          {page === 'predict' && <PredictPage />}
          {page === 'model'   && <ModelPage />}
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)', padding: '16px 28px',
        textAlign: 'center', color: '#44446a', fontSize: 10,
        fontFamily: 'Space Mono', letterSpacing: '0.05em',
      }}>
        CLZ Bug Prediction System — Random Forest | AUC 0.869 | 16,722 commits | Python + TypeScript | 2018–2026
      </footer>
    </div>
  )
}