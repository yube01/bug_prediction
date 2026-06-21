import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps a route so unauthenticated users are redirected to /signin.
 * Shows a loading spinner while the auth state is being resolved.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
      }}>
        <div style={{
          width: 28, height: 28,
          border: '3px solid var(--border2)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
