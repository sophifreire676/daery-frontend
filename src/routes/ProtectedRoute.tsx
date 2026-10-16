import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Exige perfil com acesso à Home 2 (profissional, instituição, pesquisador ou admin). */
  requireProfessional?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ children, requireProfessional, redirectTo }: ProtectedRouteProps) {
  const { isAuthenticated, isReady, user } = useAuth()
  const location = useLocation()

  // Sessão salva ainda sendo conferida: não redireciona antes da hora.
  if (!isReady) {
    return (
      <div role="status" aria-live="polite" className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Carregando sua sessão…
      </div>
    )
  }

  if (!isAuthenticated) {
    // Guarda o destino para voltar a ele depois do login.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireProfessional && !user?.isProfessional) {
    return <Navigate to={redirectTo ?? '/home-public'} replace />
  }

  return <>{children}</>
}
