import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, authLogin, authMe, authRegister, setForbiddenHandler, setUnauthorizedHandler, updateMe } from '../services/api'
import { clearSession, readSession, writeSession, writeUser } from '../services/authStorage'
import type { ApiUser, MeResponse, RegisterPayload, Role } from '../types/api'
import { canAccessProfessionalHome, initialsOf } from '../utils/roles'

export interface AuthUser extends ApiUser {
  initials: string
  /** Perfil com acesso à Home 2 (profissional, instituição, pesquisador ou admin). */
  isProfessional: boolean
  /** Cadastro de profissional/instituição aguardando aprovação do admin. */
  isPendingVerification: boolean
}

/**
 * - `checking`: há token salvo, mas ainda não sabemos quem é o usuário (aguardando /auth/me).
 * - `authenticated`: usuário conhecido (pode estar sendo revalidado em segundo plano).
 * - `anonymous`: sem sessão.
 */
export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  isAuthenticated: boolean
  /** false enquanto a sessão salva ainda está sendo conferida; rotas protegidas esperam. */
  isReady: boolean
  /** true durante login ou cadastro (para o estado de carregamento dos botões). */
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (payload: RegisterPayload) => Promise<AuthUser>
  logout: () => void
  /** Relê o usuário no servidor (ex.: depois de uma aprovação pelo admin). */
  refresh: () => Promise<void>
  /** Dados de cadastro profissional/institucional de GET /auth/me (null até a primeira leitura). */
  details: Pick<MeResponse, 'professionalRegistration' | 'institution'> | null
  updateName: (name: string) => Promise<void>
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function toAuthUser(user: ApiUser): AuthUser {
  return {
    ...user,
    initials: initialsOf(user.name),
    isProfessional: canAccessProfessionalHome(user.role),
    isPendingVerification: user.verificationStatus === 'PENDING',
  }
}

function initialState(): { user: AuthUser | null; status: AuthStatus } {
  // Leitura síncrona: na primeira renderização já sabemos se há sessão. Isso evita
  // o redirecionamento indevido para /login ao recarregar uma página protegida.
  const { token, user } = readSession()
  if (!token) return { user: null, status: 'anonymous' }
  if (user) return { user: toAuthUser(user), status: 'authenticated' }
  return { user: null, status: 'checking' }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [details, setDetails] = useState<AuthContextValue['details']>(null)

  // Guarda o usuário de /auth/me e os dados de cadastro que vêm junto.
  const applyMe = useCallback((me: MeResponse) => {
    const { professionalRegistration, institution, ...apiUser } = me
    writeUser(apiUser)
    setDetails({ professionalRegistration, institution })
    setState({ user: toAuthUser(apiUser), status: 'authenticated' })
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setDetails(null)
    setState({ user: null, status: 'anonymous' })
  }, [])

  const startSession = useCallback((token: string, apiUser: ApiUser) => {
    writeSession(token, apiUser)
    const authUser = toAuthUser(apiUser)
    setState({ user: authUser, status: 'authenticated' })
    return authUser
  }, [])

  const refresh = useCallback(async () => {
    applyMe(await authMe())
  }, [applyMe])

  const updateName = useCallback(
    async (name: string) => {
      applyMe(await updateMe({ name: name.trim() }))
    },
    [applyMe]
  )

  // Qualquer 401 da API (token vencido, conta desativada) encerra a sessão.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Um 403 indica que o perfil salvo pode estar desatualizado: relê a conta no servidor.
  // Se o perfil mudou, as rotas protegidas redirecionam sozinhas. Uma releitura por vez.
  const refreshingRef = useRef(false)
  useEffect(() => {
    setForbiddenHandler(() => {
      if (refreshingRef.current || !readSession().token) return
      refreshingRef.current = true
      authMe()
        .then(applyMe)
        .catch(() => undefined) // 401 já encerra a sessão pelo outro handler; rede fora: mantém
        .finally(() => {
          refreshingRef.current = false
        })
    })
    return () => setForbiddenHandler(null)
  }, [applyMe])

  // Revalida a sessão salva ao abrir o app: o perfil pode ter mudado (ex.: aprovação).
  useEffect(() => {
    if (state.status === 'anonymous') return
    const controller = new AbortController()
    authMe(controller.signal)
      .then(applyMe)
      .catch(error => {
        if (error instanceof ApiError && error.status === 401) return // o handler já fez logout
        if ((error as Error).name === 'AbortError') return
        // Servidor fora do ar: mantém a sessão salva; se não havia usuário salvo, desiste.
        setState(current => (current.user ? current : { user: null, status: 'anonymous' }))
      })
    return () => controller.abort()
    // Só na montagem: depois disso a sessão muda por login/logout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      try {
        const { token, user } = await authLogin(email.trim().toLowerCase(), password)
        return startSession(token, user)
      } finally {
        setIsLoading(false)
      }
    },
    [startSession]
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true)
      try {
        const { token, user } = await authRegister(payload)
        return startSession(token, user)
      } finally {
        setIsLoading(false)
      }
    },
    [startSession]
  )

  const hasRole = useCallback((...roles: Role[]) => !!state.user && roles.includes(state.user.role), [state.user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      status: state.status,
      isAuthenticated: state.status === 'authenticated',
      isReady: state.status !== 'checking',
      isLoading,
      login,
      register,
      logout,
      refresh,
      details,
      updateName,
      hasRole,
    }),
    [state, isLoading, login, register, logout, refresh, details, updateName, hasRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
