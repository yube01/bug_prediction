import React, { useState } from 'react'
import { predictCommit } from '../api'
import type { CommitFeatures, PredictionResponse } from '../types'
import RiskGauge from '../components/website/RiskGauge'
import SliderField from '../components/website/SliderField'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'

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
  pct >= 60 ? 'var(--color-error)' : pct >= 30 ? 'var(--color-warning)' : 'var(--color-success)'

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

      {/* ── Form ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Code Size */}
        <Card className="shadow-none">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-xs text-primary font-bold uppercase tracking-[0.12em]">Code Size</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <SliderField label="Lines Added"   name="lines_added"   value={form.lines_added}
              onChange={handleChange} min={0} max={2000} step={10} description="Lines of code added" />
            <SliderField label="Lines Deleted" name="lines_deleted" value={form.lines_deleted}
              onChange={handleChange} min={0} max={1000} step={10} description="Lines of code removed" />
            <SliderField label="Files Changed" name="files_changed" value={form.files_changed}
              onChange={handleChange} min={1} max={100} description="Files touched" />
            <SliderField label="Methods Changed" name="num_methods" value={form.num_methods}
              onChange={handleChange} min={0} max={100} description="Functions modified" />
          </CardContent>
        </Card>

        {/* Complexity */}
        <Card className="shadow-none">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-xs text-primary font-bold uppercase tracking-[0.12em]">Complexity</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <SliderField label="Avg Complexity" name="avg_complexity" value={form.avg_complexity}
              onChange={handleChange} min={0} max={50} step={0.5}
              description="Cyclomatic complexity of changed methods" />
          </CardContent>
        </Card>

        {/* Tests */}
        <Card className="shadow-none">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-xs text-primary font-bold uppercase tracking-[0.12em]">Test Coverage</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4">
            <SliderField label="Test Files Changed" name="test_files_changed" value={form.test_files_changed}
              onChange={handleChange} min={0} max={50} description="Number of test files updated" />
            {/* Auto test ratio bar */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] text-fg-secondary uppercase tracking-[0.09em]">
                  Test Ratio (auto)
                </span>
                <span className="font-mono text-[11px] text-primary">
                  {(form.test_files_changed / Math.max(form.files_changed, 1)).toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-300"
                  style={{ width: `${Math.min((form.test_files_changed / Math.max(form.files_changed, 1)) * 100, 100)}%` }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer */}
        <Card className="shadow-none">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-xs text-primary font-bold uppercase tracking-[0.12em]">Developer History</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <SliderField label="Prior Bugs (Author)" name="prior_bugs_author" value={form.prior_bugs_author}
              onChange={handleChange} min={0} max={30}
              description="Bugs this developer caused before — #1 predictor (39% importance)" />
          </CardContent>
        </Card>

        {/* Timing */}
        <Card className="shadow-none">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-xs text-primary font-bold uppercase tracking-[0.12em]">Timing</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SliderField label="Commit Hour" name="commit_hour" value={form.commit_hour}
                onChange={handleChange} min={0} max={23} description="0=midnight  23=11pm" />
              <SliderField label="Day of Week" name="day_of_week" value={form.day_of_week}
                onChange={handleChange} min={0} max={6} description="0=Mon  6=Sun" />
            </div>
            <div className="flex gap-2">
              {(['is_weekend', 'is_night_commit'] as const).map(key => {
                const labels = { is_weekend: 'Weekend', is_night_commit: 'Night Commit' }
                const descs  = { is_weekend: 'Sat / Sun', is_night_commit: 'After 10pm or before 5am' }
                const on     = form[key] === 1
                return (
                  <button key={key} type="button"
                    onClick={() => setForm(f => ({ ...f, [key]: (f[key] ? 0 : 1) as 0 | 1 }))}
                    className={`flex-1 p-3 text-left border rounded-lg transition-all duration-200 ${
                      on ? 'border-primary bg-primary/10 text-primary-text' : 'border-border bg-bg text-fg-secondary'
                    }`}
                  >
                    <div className="text-[11px] font-bold font-mono">{labels[key]}</div>
                    <div className="text-[9px] opacity-60 mt-0.5">{descs[key]}</div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Context */}
        <Card className="shadow-none">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-xs text-primary font-bold uppercase tracking-[0.12em]">Context</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language */}
            <div>
              <div className="text-[10px] text-fg-secondary uppercase tracking-[0.09em] mb-2">
                Language
              </div>
              <div className="flex gap-2">
                {(['Python', 'TypeScript'] as const).map(lang => (
                  <button key={lang} type="button"
                    onClick={() => setForm(f => ({ ...f, language_group: lang }))}
                    className={`flex-1 py-2 border rounded-lg text-[11px] font-mono transition-all duration-200 ${
                      form.language_group === lang ? 'border-primary bg-primary/10 text-primary-text' : 'border-border bg-bg text-fg-secondary'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Time period */}
            <div>
              <div className="text-[10px] text-fg-secondary uppercase tracking-[0.09em] mb-2">
                Time Period
              </div>
              <select name="time_period" value={form.time_period} onChange={handleChange}
                className="w-full p-2 bg-bg border border-border rounded-lg text-fg font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="2018-2020">2018 – 2020</option>
                <option value="2021-2023">2021 – 2023</option>
                <option value="2024-2026">2024 – 2026</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full py-6 bg-gradient-to-br from-primary to-primary-focus hover:to-primary-accent text-white font-heading font-bold text-sm tracking-[0.06em] shadow-lg shadow-primary/30 transition-all rounded-xl"
        >
          {loading ? '[ ANALYZING... ]' : '[ PREDICT BUG RISK ]'}
        </Button>

        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/25 text-error text-xs">
            ❌ {error}
            <div className="text-[10px] mt-1 opacity-65">
              Ensure FastAPI is running at localhost:8000
            </div>
          </div>
        )}
      </form>

      {/* ── Result panel ─────────────────────────────────── */}
      <div className="sticky top-20">
        <div 
          className="bg-fill1 border rounded-xl p-5 transition-colors duration-400"
          style={{ 
            borderColor: result ? color : 'var(--color-border)',
            boxShadow: result ? `0 0 32px ${color}12` : 'none'
          }}
        >
          <div className="text-[10px] text-fg-secondary uppercase tracking-[0.12em] mb-4 text-center font-mono">
            Risk Analysis
          </div>

          <div className="flex justify-center mb-5">
            <RiskGauge probability={prob} />
          </div>

          {result ? (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Risk factors */}
              <div>
                <div className="text-[9px] text-fg-secondary uppercase tracking-[0.09em] mb-2">
                  Risk Factors
                </div>
                <div className="flex flex-col gap-1.5">
                  {result.top_risk_factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg text-[11px]"
                         style={{ backgroundColor: `${color}0e`, border: `1px solid ${color}20` }}>
                      <span style={{ color, fontSize: 12 }}>▲</span>
                      <span className="text-fg">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3 rounded-lg bg-fill2 border border-border text-[11px] text-fg leading-relaxed">
                <div className="text-[9px] text-fg-secondary uppercase tracking-[0.09em] mb-1.5">
                  Recommendation
                </div>
                {result.recommendation}
              </div>

              {/* Probability */}
              <div className="flex justify-between items-center p-2 px-3 rounded-lg bg-bg border border-border text-[11px]">
                <span className="text-fg-secondary">Bug Probability</span>
                <span className="font-bold font-mono" style={{ color }}>
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-fg-disabled text-[11px] py-5">
              Fill in the form<br />and click Predict
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="mt-4">
          <div className="text-[9px] text-fg-secondary uppercase tracking-[0.09em] mb-2">
            Quick Presets
          </div>
          <div className="flex flex-col gap-1.5">
            {PRESETS.map(({ label, emoji, data }) => (
              <button key={label} type="button"
                onClick={() => setForm(f => ({ ...f, ...data }))}
                className="p-2.5 text-left bg-fill1 border border-border rounded-lg text-fg-secondary text-[11px] font-mono hover:border-border hover:text-fg transition-colors"
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