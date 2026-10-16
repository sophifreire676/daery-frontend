import { beforeEach, describe, expect, it } from 'vitest'
import { installSessionStorage, MemoryStorage } from './memoryStorage'
import { clearSession, readSession, writeSession } from '../services/authStorage'
import { toAuthUser } from '../context/AuthContext'
import type { ApiUser } from '../types/api'

const apiUser: ApiUser = {
  id: 'u1',
  name: 'Carlos Lima',
  email: 'carlos@exemplo.com',
  role: 'CITIZEN',
  requestedRole: 'HEALTH_PROFESSIONAL',
  verificationStatus: 'PENDING',
  cpf: '***.982.247-**',
  termsAcceptedAt: '2026-10-09T00:00:00.000Z',
  termsVersion: '2026-10-15',
  isActive: true,
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z',
}

let storage: MemoryStorage
beforeEach(() => {
  storage = installSessionStorage()
})

describe('session storage', () => {
  it('round-trips token and user', () => {
    writeSession('tok', apiUser)
    expect(readSession()).toEqual({ token: 'tok', user: apiUser })
    clearSession()
    expect(readSession()).toEqual({ token: null, user: null })
  })

  it('ignores a leftover session from the old simulated login', () => {
    storage.setItem('daery_token', btoa('{"sub":"x"}'))
    storage.setItem('daery_user', JSON.stringify({ id: 'x', name: 'Fake', email: 'x', role: 'researcher', initials: 'F' }))

    expect(readSession().user).toBeNull()
  })

  it('ignores corrupted user data', () => {
    storage.setItem('daery_token', 'tok')
    storage.setItem('daery_user', '{not json')

    expect(readSession().user).toBeNull()
  })
})

describe('toAuthUser', () => {
  it('derives initials and access flags from the API user', () => {
    const user = toAuthUser(apiUser)
    expect(user.initials).toBe('CL')
    expect(user.isProfessional).toBe(false) // pendente = ainda cidadão
    expect(user.isPendingVerification).toBe(true)
    expect(toAuthUser({ ...apiUser, role: 'HEALTH_PROFESSIONAL', verificationStatus: 'APPROVED' }).isProfessional).toBe(true)
  })
})
