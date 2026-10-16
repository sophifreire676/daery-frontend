import type { ApiUser } from '../types/api'

// A sessão fica no sessionStorage: some ao fechar a aba (menor exposição que localStorage).
const TOKEN_KEY = 'daery_token'
const USER_KEY = 'daery_user'

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

export function readSession(): { token: string | null; user: ApiUser | null } {
  const s = storage()
  if (!s) return { token: null, user: null }
  const token = s.getItem(TOKEN_KEY)
  let user: ApiUser | null = null
  try {
    const raw = s.getItem(USER_KEY)
    user = raw ? (JSON.parse(raw) as ApiUser) : null
  } catch {
    user = null
  }
  // Dados antigos do login simulado (sem verificationStatus) não valem como sessão.
  if (user && !user.verificationStatus) user = null
  return { token, user }
}

export function writeSession(token: string, user: ApiUser): void {
  const s = storage()
  if (!s) return
  s.setItem(TOKEN_KEY, token)
  s.setItem(USER_KEY, JSON.stringify(user))
}

export function writeUser(user: ApiUser): void {
  storage()?.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  const s = storage()
  if (!s) return
  s.removeItem(TOKEN_KEY)
  s.removeItem(USER_KEY)
}

export function getToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null
}
