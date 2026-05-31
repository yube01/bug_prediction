import React, { useState } from 'react'
import { predictCommit } from '../api'
import type { CommitFeatures, PredictionResponse } from '../types'
import RiskGauge from '../components/website/RiskGauge'
import SliderField from '../components/website/SliderField'

const DEFAULTS: CommitFeatures = {
  lines_added: 50,  lines_deleted: 20, files_changed: 3,
  avg_complexity: 3, num_methods: 4,
  test_files_changed: 1, test_ratio: 0.33,
  complexity_per_file: 1, churn_ratio: 2.5,
  prior_bugs_author: 0,
  commit_hour: 14,  day_of_week: 1,
  is_weekend: 0,    is_night_commit: 0,
  language_group: 'Python', time_period: '2024-2026',
}

const PRESETS: { label: string; emoji: string; data: Partial<CommitFeatures> }[] = [
  {
    label: 'Risky', emoji: '🔴',
    data: {
      lines_added: 800, lines_deleted: 200, files_changed: 25,
      avg_complexity: 15, num_methods: 30, test_files_changed: 0,
      prior_bugs_author: 8, commit_hour: 23, is_weekend: 1, is_night_commit: 1,
    },
  },
  {
    label: 'Medium', emoji: '🟡',
    data: {
      lines_added: 120, lines_deleted: 40, files_changed: 6,
      avg_complexity: 6, num_methods: 8, test_files_changed: 2,
      prior_bugs_author: 2, commit_hour: 15, is_weekend: 0, is_night_commit: 0,
    },
  },
  {
    label: 'Safe', emoji: '🟢',
    data: {
      lines_added: 12, lines_deleted: 4, files_changed: 2,
      avg_complexity: 1.5, num_methods: 2, test_files_changed: 2,
      prior_bugs_author: 0, commit_hour: 10, is_weekend: 0, is_night_commit: 0,
    },
  },
]

const colorFor = (pct: number) =>
  pct >= 60 ? '#f03a4f' : pct >= 30 ? '#f5a800' : '#00c97a'

const card: React.CSSProperties = {
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r)', padding: 18,
  display: 'flex', flexDirection: 'column', gap: 14,
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Syne, sans-serif', fontWeight: 700,
  fontSize: 11, color: 'var(--accent2)',
  textTransform: 'uppercase', letterSpacing: '0.12em',
  paddingBottom: 10, borderBottom: '1px solid var(--border)',
}

export default function PredictPage() {
  const [form,    setForm]    = useState<CommitFeatures>(DEFAULTS)
  const [result,  setResult]  = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'range' || type === 'number' ? parseFloat(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const payload: CommitFeatures = {
        ...form,
        churn_ratio:         parseFloat((form.lines_added / (form.lines_deleted + 1)).toFixed(2)),
        test_ratio:          parseFloat((form.test_files_changed / Math.max(form.files_changed, 1)).toFixed(2)),
        complexity_per_file: parseFloat((form.avg_complexity / Math.max(form.files_changed, 1)).toFixed(2)),
      }
      setResult(await predictCommit(payload))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const prob  = result?.bug_probability ?? 0
  const color = colorFor(Math.round(prob * 100))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

      {/* ── Form ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Code Size */}
        <section style={card}>
          <h3 style={sectionTitle}>Code Size</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <SliderField label="Lines Added"   name="lines_added"   value={form.lines_added}
              onChange={handleChange} min={0} max={2000} step={10} description="Lines of code added" />
            <SliderField label="Lines Deleted" name="lines_deleted" value={form.lines_deleted}
              onChange={handleChange} min={0} max={1000} step={10} description="Lines of code removed" />
            <SliderField label="Files Changed" name="files_changed" value={form.files_changed}
              onChange={handleChange} min={1} max={100} description="Files touched" />
            <SliderField label="Methods Changed" name="num_methods" value={form.num_methods}
              onChange={handleChange} min={0} max={100} description="Functions modified" />
          </div>
        </section>

        {/* Complexity */}
        <section style={card}>
          <h3 style={sectionTitle}>Complexity</h3>
          <SliderField label="Avg Complexity" name="avg_complexity" value={form.avg_complexity}
            onChange={handleChange} min={0} max={50} step={0.5}
            description="Cyclomatic complexity of changed methods" />
        </section>

        {/* Tests */}
        <section style={card}>
          <h3 style={sectionTitle}>Test Coverage</h3>
          <SliderField label="Test Files Changed" name="test_files_changed" value={form.test_files_changed}
            onChange={handleChange} min={0} max={50} description="Number of test files updated" />
          {/* Auto test ratio bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                Test Ratio (auto)
              </span>
              <span style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--accent)' }}>
                {(form.test_files_changed / Math.max(form.files_changed, 1)).toFixed(2)}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, var(--accent), var(--green))',
                width: `${Math.min((form.test_files_changed / Math.max(form.files_changed, 1)) * 100, 100)}%`,
                transition: 'width 0.2s',
              }} />
            </div>
          </div>
        </section>

        {/* Developer */}
        <section style={card}>
          <h3 style={sectionTitle}>Developer History</h3>
          <SliderField label="Prior Bugs (Author)" name="prior_bugs_author" value={form.prior_bugs_author}
            onChange={handleChange} min={0} max={30}
            description="Bugs this developer caused before — #1 predictor (39% importance)" />
        </section>

        {/* Timing */}
        <section style={card}>
          <h3 style={sectionTitle}>Timing</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <SliderField label="Commit Hour" name="commit_hour" value={form.commit_hour}
              onChange={handleChange} min={0} max={23} description="0=midnight  23=11pm" />
            <SliderField label="Day of Week" name="day_of_week" value={form.day_of_week}
              onChange={handleChange} min={0} max={6} description="0=Mon  6=Sun" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['is_weekend', 'is_night_commit'] as const).map(key => {
              const labels = { is_weekend: 'Weekend', is_night_commit: 'Night Commit' }
              const descs  = { is_weekend: 'Sat / Sun', is_night_commit: 'After 10pm or before 5am' }
              const on     = form[key] === 1
              return (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, [key]: (f[key] ? 0 : 1) as 0 | 1 }))}
                  style={{
                    flex: 1, padding: '8px 12px', textAlign: 'left',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r2)',
                    background: on ? 'rgba(91,82,232,0.12)' : 'var(--bg)',
                    color: on ? 'var(--accent2)' : 'var(--text2)',
                    cursor: 'pointer', fontFamily: 'Space Mono', transition: 'all 0.2s',
                  }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{labels[key]}</div>
                  <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{descs[key]}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Context */}
        <section style={card}>
          <h3 style={sectionTitle}>Context</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Language */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
                Language
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['Python', 'TypeScript'] as const).map(lang => (
                  <button key={lang} type="button"
                    onClick={() => setForm(f => ({ ...f, language_group: lang }))}
                    style={{
                      flex: 1, padding: '7px 0',
                      border: `1px solid ${form.language_group === lang ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--r2)',
                      background: form.language_group === lang ? 'rgba(91,82,232,0.12)' : 'var(--bg)',
                      color: form.language_group === lang ? 'var(--accent2)' : 'var(--text2)',
                      cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11,
                      transition: 'all 0.2s',
                    }}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Time period */}
            <div>
              <div style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
                Time Period
              </div>
              <select name="time_period" value={form.time_period} onChange={handleChange}
                style={{
                  width: '100%', padding: '7px 10px',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r2)', color: 'var(--text)',
                  fontFamily: 'Space Mono', fontSize: 11, cursor: 'pointer',
                }}>
                <option value="2018-2020">2018 – 2020</option>
                <option value="2021-2023">2021 – 2023</option>
                <option value="2024-2026">2024 – 2026</option>
              </select>
            </div>
          </div>
        </section>

        {/* Submit */}
        <button type="submit" disabled={loading} style={{
          padding: '14px 28px',
          background: loading
            ? 'var(--border)'
            : 'linear-gradient(135deg, var(--accent), var(--accent2))',
          border: 'none', borderRadius: 'var(--r)',
          color: loading ? 'var(--text2)' : '#fff',
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.06em', transition: 'all 0.2s',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(91,82,232,0.4)',
        }}>
          {loading ? '[ ANALYZING... ]' : '[ PREDICT BUG RISK ]'}
        </button>

        {error && (
          <div style={{
            padding: 14, borderRadius: 'var(--r)',
            background: 'rgba(240,58,79,0.08)',
            border: '1px solid rgba(240,58,79,0.25)',
            color: '#f03a4f', fontSize: 12,
          }}>
            ❌ {error}
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.65 }}>
              Ensure FastAPI is running at localhost:8000
            </div>
          </div>
        )}
      </form>

      {/* ── Result panel ─────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 72 }}>
        <div style={{
          background: 'var(--bg2)',
          border: `1px solid ${result ? color + '44' : 'var(--border)'}`,
          borderRadius: 'var(--r)', padding: 20,
          transition: 'border-color 0.4s',
          boxShadow: result ? `0 0 32px ${color}12` : 'none',
        }}>
          <div style={{
            fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase',
            letterSpacing: '0.12em', marginBottom: 18, textAlign: 'center',
            fontFamily: 'Space Mono',
          }}>
            Risk Analysis
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <RiskGauge probability={prob} />
          </div>

          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp 0.35s ease' }}>
              {/* Risk factors */}
              <div>
                <div style={{ fontSize: 9, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
                  Risk Factors
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {result.top_risk_factors.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 'var(--r2)',
                      background: `${color}0e`, border: `1px solid ${color}20`,
                      fontSize: 11,
                    }}>
                      <span style={{ color, fontSize: 12 }}>▲</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div style={{
                padding: 12, borderRadius: 'var(--r2)',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                fontSize: 11, color: 'var(--text)', lineHeight: 1.65,
              }}>
                <div style={{ fontSize: 9, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>
                  Recommendation
                </div>
                {result.recommendation}
              </div>

              {/* Probability */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: 'var(--r2)',
                background: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: 11,
              }}>
                <span style={{ color: 'var(--text2)' }}>Bug Probability</span>
                <span style={{ fontWeight: 700, color, fontFamily: 'Space Mono' }}>
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#44446a', fontSize: 11, padding: '20px 0' }}>
              Fill in the form<br />and click Predict
            </div>
          )}
        </div>

        {/* Presets */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 9, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
            Quick Presets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRESETS.map(({ label, emoji, data }) => (
              <button key={label} type="button"
                onClick={() => setForm(f => ({ ...f, ...data }))}
                style={{
                  padding: '9px 12px', textAlign: 'left',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r2)', color: 'var(--text2)',
                  cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'
                }}
              >
                {emoji} {label} Commit
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}