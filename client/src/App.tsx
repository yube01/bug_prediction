import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import PredictPage from './pages/PredictPage'
import ModelPage from './pages/ModelPage'
import SearchHistoryPage from './pages/SearchHistoryPage'
import LeaderboardPage from './pages/LeaderboardPage'
import Navbar from './components/website/Navbar'
import CommitExplorer from './pages/ExplorePage'
import LandingPage from './pages/LandingPage'

/* ─── App Router ──────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/"
        element={<LandingPage />}
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <CommitExplorer />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <SearchHistoryPage />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <DashboardPage />
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/predict"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-mono)' }}>
                <PredictPage />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/model"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-mono)' }}>
                <ModelPage />
              </div>
            </>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <>
              <Navbar />
              <LeaderboardPage />
            </>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
