import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import HomePublic from './pages/HomePublic'
import HomeProfessional from './pages/HomeProfessional'
import { homePathFor } from './utils/roles'

function RootRedirect() {
  const { isReady, user } = useAuth()
  if (!isReady) return null
  return <Navigate to={homePathFor(user?.role)} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/home-public" element={<HomePublic />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/home-professional"
        element={
          <ProtectedRoute requireProfessional>
            <HomeProfessional />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}