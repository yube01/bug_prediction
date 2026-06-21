import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Floating gradient orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-card">
        {/* Logo / branding */}
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--accent)" />
              <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to Bug Predictor</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="auth-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner" />
                Signing in…
              </span>
            ) : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  )
}
