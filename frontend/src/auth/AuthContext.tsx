import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiPost } from '../api/client'
import type { LoginResponse, Session } from '../api/types'
import { clearSession, readSession, writeSession } from './session'

type AuthContextValue = {
  session: Session | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(() => readSession())

  useEffect(() => {
    const onLogout = () => setSession(null)
    window.addEventListener('registre-logout', onLogout)
    return () => window.removeEventListener('registre-logout', onLogout)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async login(email, password) {
        const response = await apiPost<LoginResponse>('/auth/login', { email, password })
        setSession(writeSession(response.token))
      },
      logout() {
        clearSession()
        setSession(null)
        queryClient.clear()
      },
    }),
    [queryClient, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
