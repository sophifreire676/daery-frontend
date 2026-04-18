// Camada de comunicação com a API REST do Daery.
// Quando o backend estiver disponível, configurar a BASE_URL com a URL real.
//
// Não usa axios porque a dependência não está instalada.
// Implementa o mesmo contrato (instância com baseURL + interceptor de token)
// usando fetch nativo + wrapper tipado.
// Para migrar para axios quando disponível: substituir fetchAPI por axios.create(...)
// e configurar axios.interceptors.request.use(config => { config.headers.Authorization = ... })

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

function getToken(): string | null {
  return sessionStorage.getItem('daery_token')
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
}

interface ApiResponse<T = unknown> {
  data: T
  status: number
}

async function fetchAPI<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const token = getToken()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const error = new Error(
      (errorBody as { message?: string }).message ?? `HTTP ${response.status}`
    )
    ;(error as Error & { status: number }).status = response.status
    throw error
  }

  const data: T = await response.json()
  return { data, status: response.status }
}

// --- Endpoints do Daery ---
// Cada função mapeia um endpoint documentado na especificação (Seção 22.2).
// Substituir os retornos mock pelos calls reais quando o backend existir.

export interface EpiCase {
  id: number
  city: string
  state: string
  disease: string
  cases: number
  newCases?: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  coordinates: [number, number]
  lastUpdate: string
  trend?: 'up' | 'down' | 'stable'
}

export interface EpiAlert {
  id: number
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  time: string
  read: boolean
}

// GET /api/v1/epidemiological-cases
export async function getCases(params?: {
  disease?: string
  severity?: string
  startDate?: string
  endDate?: string
  search?: string
  signal?: AbortSignal
}): Promise<EpiCase[]> {

  void fetchAPI
  return Promise.resolve([])
}

export async function getAlerts(): Promise<EpiAlert[]> {
  return Promise.resolve([])
}

export async function exportCSV(params: {
  disease?: string
  startDate?: string
  endDate?: string
}): Promise<Blob> {
  const token = getToken()
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => Boolean(v)))
  ).toString()

  const response = await fetch(`${BASE_URL}/export?${query}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  if (!response.ok) throw new Error(`Erro ao exportar: HTTP ${response.status}`)
  return response.blob()
}

// POST /api/v1/auth/login
export async function authLogin(email: string, password: string) {
  return fetchAPI<{ token: string; user: unknown }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function authRegister(payload: {
  nome: string
  email: string
  senha: string
  cpf: string
  profile: 'geral' | 'profissional'
  tipoRegistro?: string
  numeroRegistro?: string
  estadoUF?: string
  especialidade?: string
}) {
  return fetchAPI('/auth/register', { method: 'POST', body: payload })
}
