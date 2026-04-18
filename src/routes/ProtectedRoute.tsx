import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, UserRole } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={redirectTo ?? '/home-public'} replace />
  }

  return <>{children}</>
}
