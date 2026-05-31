import React, { useEffect, useState } from 'react'
import { getModelInfo } from '../api'
import type { ModelInfoResponse } from '../types'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

const card: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', padding: 18,
}
const cardTitle: React.CSSProperties = {
  fontFamily: 'Syne, sans-serif', fontWeight: 700,
  fontSize: 11, color: 'var(--accent2)',
  textTransform: 'uppercase', letterSpacing: '0.12em',
  marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)',
}

export default function ModelPage() {
  const [info,    setInfo]    = useState<ModelInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    getModelInfo()
      .then(setInfo)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>
      <div style={{
        width: 28, height: 28, border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite', margin: '0 auto 14px',
      }} />
      Loading...
    </div>
  )

  if (error || !info) return (
    <div style={{
      padding: 20, borderRadius: 'var(--r)',
      background: 'rgba(240,58,79,0.08)',
      border: '1px solid rgba(240,58,79,0.25)', color: '#f03a4f',
    }}>
      ❌ {error} — Make sure FastAPI is running at localhost:8000
    </div>
  )

  const metrics = [
    { name: 'AUC',       value: info.test_auc,       color: '#5b52e8' },
    { name: 'Precision', value: info.test_precision,  color: '#00c97a' },
    { name: 'Recall',    value: info.test_recall,     color: '#f5a800' },
    { name: 'F1',        value: info.test_f1,         color: '#f03a4f' },
  ]

  const radarData = metrics.map(m => ({
    metric: m.name, value: Math.round(m.value * 100),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {metrics.map(m => (
          <div key={m.name} style={{
            ...card,
            border: `1px solid ${m.color}30`,
            textAlign: 'center',
            boxShadow: `0 4px 20px ${m.color}10`,
          }}>
            <div style={{
              fontSize: 30, fontWeight: 800,
              fontFamily: 'Syne, sans-serif', color: m.color,
            }}>
              {(m.value * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 4 }}>
              {m.name}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Radar */}
        <div style={card}>
          <h3 style={cardTitle}>Performance Radar</h3>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric"
                tick={{ fill: 'var(--text2)', fontSize: 11, fontFamily: 'Space Mono' }} />
              <Radar dataKey="value" stroke="var(--accent)"
                fill="var(--accent)" fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Details */}
        <div style={card}>
          <h3 style={cardTitle}>Model Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              ['Algorithm',     info.model_type],
              ['Training Data', info.training_data],
              ['Top Predictor', info.top_predictor],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{
                padding: 10, borderRadius: 'var(--r2)',
                background: 'var(--bg3)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={card}>
          <h3 style={cardTitle}>Features ({info.features.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {info.features.map((f, i) => (
              <div key={f} style={{
                padding: '5px 9px', borderRadius: 'var(--r2)',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                fontSize: 10,
                color: i === 0 ? 'var(--accent2)' : 'var(--text2)',
                fontWeight: i === 0 ? 700 : 400,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ color: i === 0 ? 'var(--accent)' : 'var(--border2)' }}>▸</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Risk thresholds */}
        <div style={card}>
          <h3 style={cardTitle}>Risk Thresholds</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              { level: 'LOW RISK',    range: '0% – 30%',   color: '#00c97a', icon: '🟢', action: 'Safe to merge' },
              { level: 'MEDIUM RISK', range: '30% – 60%',  color: '#f5a800', icon: '🟡', action: 'Review recommended' },
              { level: 'HIGH RISK',   range: '60% – 100%', color: '#f03a4f', icon: '🔴', action: 'Mandatory review' },
            ] as { level: string; range: string; color: string; icon: string; action: string }[])
              .map(({ level, range, color, icon, action }) => (
                <div key={level} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: 12, borderRadius: 'var(--r2)',
                  background: `${color}08`, border: `1px solid ${color}20`,
                }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color, fontSize: 11, fontFamily: 'Syne' }}>{level}</div>
                    <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>{action}</div>
                  </div>
                  <div style={{
                    fontFamily: 'Space Mono', fontSize: 10, color,
                    background: `${color}14`, padding: '3px 8px', borderRadius: 4,
                  }}>
                    {range}
                  </div>
                </div>
              ))}
          </div>
          <div style={{
            marginTop: 12, padding: 10, borderRadius: 'var(--r2)',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            fontSize: 10, color: 'var(--text2)', lineHeight: 1.6,
          }}>
            <span style={{ color: 'var(--accent2)', fontWeight: 700 }}>Note: </span>
            Low precision (29.7%) is expected at a 5.22% bug rate — a known tradeoff in imbalanced classification. AUC 86.9% shows strong ranking ability.
          </div>
        </div>
      </div>
    </div>
  )
}