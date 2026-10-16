// Camada de comunicação com a API REST do Daery.
// Usa fetch nativo (decisão D10): o wrapper faz o papel do interceptor do Axios,
// injetando o token e padronizando os erros.
import type {
  Alert,
  AlertFilters,
  ApiErrorBody,
  ApiUser,
  AuthResponse,
  CaseNotification,
  CaseNotificationPayload,
  Disease,
  MeResponse,
  RegisterPayload,
  Region,
  SummaryFilters,
  SummaryResponse,
} from '../types/api'
import { getToken } from './authStorage'

export const BASE_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

/** Erro de API com status HTTP (0 = sem resposta: rede, servidor fora do ar). */
export class ApiError extends Error {
  status: number
  details?: ApiErrorBody['details']

  constructor(message: string, status: number, details?: ApiErrorBody['details']) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  /** Primeira mensagem de erro do campo informado, quando a API devolve erros de validação. */
  fieldError(field: string): string | undefined {
    return this.details?.fieldErrors?.[field]?.[0]
  }
}

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

/** O AuthContext registra aqui o que fazer quando a API responde 401 (token vencido ou inválido). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

type ForbiddenHandler = () => void
let onForbidden: ForbiddenHandler | null = null

/**
 * O AuthContext registra aqui o que fazer quando a API responde 403: o perfil salvo no
 * navegador pode estar desatualizado (ex.: o admin rebaixou ou desativou a permissão).
 */
export function setForbiddenHandler(handler: ForbiddenHandler | null): void {
  onForbidden = handler
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string | number | undefined | null>
  signal?: AbortSignal
  /** Rotas de login/cadastro: um 401 nelas é "credencial errada", não "sessão expirada". */
  skipUnauthorizedHandler?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError('Network error', 0)
  }

  if (response.status === 204) return undefined as T

  const body = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const errorBody = (body ?? {}) as Partial<ApiErrorBody>
    if (response.status === 401 && !options.skipUnauthorizedHandler) onUnauthorized?.()
    if (response.status === 403) onForbidden?.()
    throw new ApiError(errorBody.error ?? `HTTP ${response.status}`, response.status, errorBody.details)
  }

  return body as T
}

// --- Autenticação -----------------------------------------------------------

export function authLogin(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipUnauthorizedHandler: true,
  })
}

export function authRegister(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    skipUnauthorizedHandler: true,
  })
}

export function authMe(signal?: AbortSignal): Promise<MeResponse> {
  return request<MeResponse>('/auth/me', { signal })
}

export function updateMe(data: { name: string }): Promise<MeResponse> {
  return request<MeResponse>('/auth/me', { method: 'PATCH', body: data })
}

// --- Dados públicos (mapa, filtros e alertas) -------------------------------

export function getDiseases(signal?: AbortSignal): Promise<Disease[]> {
  return request<Disease[]>('/diseases', { signal })
}

export function getRegions(uf?: string, signal?: AbortSignal): Promise<Region[]> {
  return request<Region[]>('/regions', { query: { uf }, signal })
}

export function getCaseSummary(filters: SummaryFilters = {}, signal?: AbortSignal): Promise<SummaryResponse> {
  return request<SummaryResponse>('/epidemiological-data/summary', { query: { ...filters }, signal })
}

// --- Notificação de casos (profissionais e instituições aprovados) ---------------

export function createCaseNotification(payload: CaseNotificationPayload): Promise<CaseNotification> {
  return request<CaseNotification>('/case-notifications', { method: 'POST', body: payload })
}

export function getAlerts(filters: AlertFilters = {}, signal?: AbortSignal): Promise<Alert[]> {
  return request<Alert[]>('/alerts', { query: { ...filters }, signal })
}
