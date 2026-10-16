import { describe, expect, it } from 'vitest'
import { ApiError } from '../services/api'
import { isValidCnpj, isValidCpf, maskCnpj, maskCpf } from '../utils/documents'
import { friendlyError } from '../utils/errorMessages'
import { canAccessProfessionalHome, canExportData, canReportCases, homePathFor, initialsOf, verificationLabel } from '../utils/roles'

describe('documents', () => {
  it('validates CPF check digits like the backend', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('529.982.247-26')).toBe(false)
    expect(isValidCpf('111.111.111-11')).toBe(false)
  })

  it('validates CNPJ check digits like the backend', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false)
  })

  it('masks CPF and CNPJ while typing', () => {
    expect(maskCpf('52998224725')).toBe('529.982.247-25')
    expect(maskCpf('5299')).toBe('529.9')
    expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(maskCnpj('112223')).toBe('11.222.3')
  })
})

describe('roles (decision D2)', () => {
  it('sends professionals, institutions, researchers and admins to Home 2', () => {
    for (const role of ['HEALTH_PROFESSIONAL', 'INSTITUTION', 'RESEARCHER', 'ADMIN'] as const) {
      expect(canAccessProfessionalHome(role)).toBe(true)
      expect(homePathFor(role)).toBe('/home-professional')
    }
    expect(canAccessProfessionalHome('CITIZEN')).toBe(false)
    expect(homePathFor(undefined)).toBe('/home-public')
  })

  it('lets only professionals and institutions report cases', () => {
    expect(canReportCases('HEALTH_PROFESSIONAL')).toBe(true)
    expect(canReportCases('INSTITUTION')).toBe(true)
    expect(canReportCases('ADMIN')).toBe(false)
    expect(canReportCases('CITIZEN')).toBe(false)
  })

  it('lets only researchers and admins export data (RF-005)', () => {
    expect(canExportData('RESEARCHER')).toBe(true)
    expect(canExportData('ADMIN')).toBe(true)
    for (const role of ['HEALTH_PROFESSIONAL', 'INSTITUTION', 'CITIZEN'] as const) expect(canExportData(role)).toBe(false)
    expect(canExportData(undefined)).toBe(false)
  })

  it('describes a pending or rejected verification', () => {
    expect(verificationLabel('PENDING', 'HEALTH_PROFESSIONAL')).toBe('Cadastro profissional em análise')
    expect(verificationLabel('REJECTED', 'INSTITUTION')).toBe('Cadastro da instituição não aprovado')
    expect(verificationLabel('APPROVED', 'HEALTH_PROFESSIONAL')).toBeNull()
  })

  it('builds initials from the name', () => {
    expect(initialsOf('Ana Maria Souza')).toBe('AS')
    expect(initialsOf('Ana')).toBe('AN')
  })
})

describe('friendlyError', () => {
  it('translates known API messages', () => {
    expect(friendlyError(new ApiError('Invalid credentials', 401))).toBe('E-mail ou senha incorretos.')
    expect(friendlyError(new ApiError('CPF already in use', 409))).toBe('Este CPF já está cadastrado.')
  })

  it('explains network, rate-limit and server failures', () => {
    expect(friendlyError(new ApiError('Network error', 0))).toMatch(/conectar ao servidor/)
    expect(friendlyError(new ApiError('HTTP 429', 429))).toMatch(/Muitas tentativas/)
    expect(friendlyError(new ApiError('Internal server error', 500))).toMatch(/servidor encontrou um erro/)
  })
})
