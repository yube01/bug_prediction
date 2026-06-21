import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 10) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 1) return { level: 1, label: 'Weak', color: 'var(--red)' }
    if (score <= 3) return { level: 2, label: 'Medium', color: 'var(--yellow)' }
    return { level: 3, label: 'Strong', color: 'var(--green)' }
  })()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await signUp(fullName, email, password)
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
              <path d="M16 8V24M8 16H24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Get started with Bug Predictor</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="auth-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="pw-strength">
                <div className="pw-strength-track">
                  <div
                    className="pw-strength-fill"
                    style={{
                      width: `${(passwordStrength.level / 3) * 100}%`,
                      background: passwordStrength.color,
                    }}
                  />
                </div>
                <span className="pw-strength-label" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <span className="pw-mismatch">Passwords don't match</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner" />
                Creating account…
              </span>
            ) : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/signin" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
