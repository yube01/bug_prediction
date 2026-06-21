import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { signIn as apiSignIn, signUp as apiSignUp, getMe, type AuthUser } from '../api/auth'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'bp_auth_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY))

  // On mount: if token exists, validate it
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) { setLoading(false); return }
    getMe(stored)
      .then(u => { setUser(u); setToken(stored) })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null) })
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiSignIn(email, password)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiSignUp(name, email, password)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
