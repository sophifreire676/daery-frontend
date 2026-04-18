import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type UserRole = 'public' | 'researcher'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  initials: string
}

interface LoginOptions {
  roleHint?: UserRole
  displayName?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string, options?: LoginOptions) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getInitialsFromName(name: string) {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function mockDecode(email: string, options?: LoginOptions): AuthUser {
  const normalizedEmail = email.toLowerCase()

  const inferredResearcher =
    normalizedEmail.includes('pesquisador') ||
    normalizedEmail.includes('researcher') ||
    normalizedEmail.includes('medic') ||
    normalizedEmail.includes('dr.')

  const role: UserRole = options?.roleHint ?? (inferredResearcher ? 'researcher' : 'public')

  const emailBasedName = email.split('@')[0].replace(/[._]/g, ' ')
  const fallbackName = role === 'researcher'
    ? 'Drauzio Varella'
    : emailBasedName.charAt(0).toUpperCase() + emailBasedName.slice(1)

  const displayName = options?.displayName?.trim() || fallbackName
  const initials = getInitialsFromName(displayName)

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    name: displayName,
    email,
    role,
    initials,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const storedToken = sessionStorage.getItem('daery_token')
    const storedUser = sessionStorage.getItem('daery_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        sessionStorage.clear()
      }
    }
  }, [])

  const login = useCallback(async (email: string, _password: string, options?: LoginOptions) => {
    setIsLoading(true)

    await new Promise(r => setTimeout(r, 1200))

    const decoded = mockDecode(email, options)
    const fakeToken = btoa(
      JSON.stringify({
        sub: email,
        role: decoded.role,
        iat: Date.now(),
      })
    )

    setToken(fakeToken)
    setUser(decoded)
    sessionStorage.setItem('daery_token', fakeToken)
    sessionStorage.setItem('daery_user', JSON.stringify(decoded))
    setIsLoading(false)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem('daery_token')
    sessionStorage.removeItem('daery_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}