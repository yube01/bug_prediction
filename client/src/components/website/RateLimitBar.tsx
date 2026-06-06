import { useEffect, useState } from 'react'
import type { RateLimitInfo } from '../../types'
import { fetchRateLimit, onRateLimitUpdate } from '../../api/github'

function formatReset(date: Date): string {
  const mins = Math.max(0, Math.round((date.getTime() - Date.now()) / 60000))
  if (mins <= 0) return 'now'
  if (mins === 1) return 'in 1 min'
  return `in ${mins} min`
}

export default function RateLimitBar() {
  const [info,    setInfo]    = useState<RateLimitInfo | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fetch initial rate limit on mount
    fetchRateLimit().then(setInfo).catch(() => null)

    // Subscribe to updates from every API call
    const unsub = onRateLimitUpdate(setInfo)
    return unsub
  }, [])

  if (!info) return null

  const pct      = (info.remaining / info.limit) * 100
  const isLow    = info.remaining <= 15
  const isGone   = info.remaining === 0
  const barColor = isGone ? '#E24B4A' : isLow ? '#BA7517' : '#1D9E75'
  const bgColor  = isGone ? '#FCEBEB' : isLow ? '#FAEEDA' : '#EAF3DE'
  const txtColor = isGone ? '#A32D2D' : isLow ? '#854F0B' : '#3B6D11'

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setVisible(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: bgColor,
          border: `0.5px solid ${barColor}44`,
          borderRadius: 'var(--border-radius-md)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
        }}
        title="GitHub API rate limit"
        aria-label={`GitHub API: ${info.remaining} requests remaining`}
      >
        {/* Mini bar */}
        <div style={{
          width: 40, height: 5,
          background: `${barColor}30`,
          borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: barColor,
            borderRadius: 2,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <span style={{ fontSize: 11, color: txtColor, whiteSpace: 'nowrap' }}>
          {info.remaining}/{info.limit} req
        </span>
      </button>

      {/* Tooltip */}
      {visible && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '14px 16px',
          width: 240, zIndex: 50,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
            GitHub API rate limit
          </div>

          {/* Big bar */}
          <div style={{
            height: 8, background: `${barColor}20`,
            borderRadius: 4, overflow: 'hidden', marginBottom: 10,
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: barColor, borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              ['Remaining', `${info.remaining} requests`],
              ['Limit',     `${info.limit} / hour`],
              ['Resets',    formatReset(info.resetAt)],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 12,
              }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {isLow && (
            <div style={{
              marginTop: 10, padding: '8px 10px',
              background: isGone ? '#FCEBEB' : '#FAEEDA',
              color:      isGone ? '#A32D2D' : '#854F0B',
              borderRadius: 'var(--border-radius-md)',
              fontSize: 11, lineHeight: 1.5,
            }}>
              {isGone
                ? `Rate limit reached. Resets ${formatReset(info.resetAt)}.`
                : `Running low. Add a GitHub token to get 5,000 req/hr.`
              }
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Unauthenticated: 60/hr<br />
            With token: 5,000/hr
          </div>

          <button onClick={() => setVisible(false)} style={{
            marginTop: 10, width: '100%', padding: '6px 0',
            fontSize: 12, color: 'var(--color-text-secondary)',
          }}>
            Close
          </button>
        </div>
      )}
    </div>
  )
}