import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installSessionStorage, MemoryStorage } from './memoryStorage'
import { ApiError, authLogin, authMe, BASE_URL, getCaseSummary, request, setForbiddenHandler, setUnauthorizedHandler } from '../services/api'

const fetchMock = vi.fn()
let storage: MemoryStorage

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response

beforeEach(() => {
  storage = installSessionStorage()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  setUnauthorizedHandler(null)
  setForbiddenHandler(null)
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('uses the backend base URL without the old /v1 prefix', () => {
    expect(BASE_URL).toBe('http://localhost:3000/api')
  })

  it('sends the saved token as a Bearer header', async () => {
    storage.setItem('daery_token', 'abc.def.ghi')
    fetchMock.mockResolvedValue(json(200, { id: 'u1' }))

    await authMe()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/api/auth/me')
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi')
  })

  it('does not send Authorization without a session', async () => {
    fetchMock.mockResolvedValue(json(200, {}))

    await request('/diseases')

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('omits empty query parameters', async () => {
    fetchMock.mockResolvedValue(json(200, { items: [] }))

    await getCaseSummary({ uf: 'GO', diseaseId: undefined, startDate: '' })

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/epidemiological-data/summary?uf=GO')
  })

  it('turns the API error body into an ApiError with field details', async () => {
    fetchMock.mockResolvedValue(
      json(400, { error: 'Validation failed', details: { fieldErrors: { cpf: ['cpf must be a valid CPF'] } } })
    )

    const error = (await request('/auth/register', { method: 'POST', body: {} }).catch(e => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('Validation failed')
    expect(error.fieldError('cpf')).toBe('cpf must be a valid CPF')
  })

  it('reports a network failure as status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = (await request('/diseases').catch(e => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
  })

  it('returns undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => { throw new Error('no body') } })

    await expect(request('/case-notifications/x', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('calls the unauthorized handler when a session request gets 401', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    fetchMock.mockResolvedValue(json(401, { error: 'Invalid or expired token' }))

    await expect(authMe()).rejects.toBeInstanceOf(ApiError)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('calls the forbidden handler on 403 (the saved profile may be outdated), without ending the session', async () => {
    const forbidden = vi.fn()
    const unauthorized = vi.fn()
    setForbiddenHandler(forbidden)
    setUnauthorizedHandler(unauthorized)
    fetchMock.mockResolvedValue(json(403, { error: 'Insufficient permissions' }))

    await expect(request('/case-notifications', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 403 })

    expect(forbidden).toHaveBeenCalledTimes(1)
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('does not end the session when the login itself answers 401', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    fetchMock.mockResolvedValue(json(401, { error: 'Invalid credentials' }))

    await expect(authLogin('a@b.com', 'wrong')).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' })

    expect(handler).not.toHaveBeenCalled()
  })
})
