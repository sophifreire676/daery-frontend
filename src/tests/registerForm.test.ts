import { describe, expect, it } from 'vitest'
import { apiFieldErrorsToForm, EMPTY_FORM, toRegisterPayload, validateRegister } from '../pages/register/registerForm'

const filled = {
  ...EMPTY_FORM,
  nome: '  Ana Souza ',
  email: ' Ana@Exemplo.com ',
  senha: 'senha-segura-1',
  cpf: '529.982.247-25',
  aceiteTermos: true,
}

describe('validateRegister', () => {
  it('accepts a complete citizen form', () => {
    expect(validateRegister(filled, 'geral')).toEqual({})
  })

  it('requires LGPD consent', () => {
    expect(validateRegister({ ...filled, aceiteTermos: false }, 'geral').aceiteTermos).toBeDefined()
  })

  it('rejects an invalid CPF before calling the API', () => {
    expect(validateRegister({ ...filled, cpf: '123.456.789-00' }, 'geral').cpf).toMatch(/CPF inválido/)
  })

  it('requires council, registration number and state for professionals', () => {
    const errors = validateRegister(filled, 'profissional')
    expect(Object.keys(errors).sort()).toEqual(['conselho', 'estadoUF', 'numeroRegistro'])
  })

  it('requires a valid CNPJ for institutions', () => {
    const errors = validateRegister({ ...filled, nomeInstituicao: 'Hospital X', cnpj: '11.222.333/0001-82' }, 'instituicao')
    expect(errors.cnpj).toMatch(/CNPJ inválido/)
  })
})

describe('toRegisterPayload', () => {
  it('builds a citizen payload with trimmed name, lowercase email and CPF digits', () => {
    expect(toRegisterPayload(filled, 'geral')).toEqual({
      accountType: 'CITIZEN',
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      password: 'senha-segura-1',
      cpf: '52998224725',
      acceptTerms: true,
    })
  })

  it('builds a professional payload matching the backend contract', () => {
    const payload = toRegisterPayload(
      { ...filled, conselho: 'CRM', numeroRegistro: ' 12345 ', estadoUF: 'GO', especialidade: '' },
      'profissional'
    )
    expect(payload).toMatchObject({
      accountType: 'HEALTH_PROFESSIONAL',
      professional: { council: 'CRM', registrationNumber: '12345', uf: 'GO' },
    })
    expect('specialty' in (payload as { professional: object }).professional).toBe(false)
  })

  it('builds an institution payload with CNPJ digits', () => {
    expect(toRegisterPayload({ ...filled, nomeInstituicao: 'Hospital X', cnpj: '11.222.333/0001-81' }, 'instituicao')).toMatchObject({
      accountType: 'INSTITUTION',
      institution: { name: 'Hospital X', cnpj: '11222333000181' },
    })
  })
})

describe('apiFieldErrorsToForm', () => {
  it('places server-side field errors on the matching form fields', () => {
    expect(apiFieldErrorsToForm({ cpf: ['x'], professional: ['Required'] })).toEqual({
      cpf: 'Valor inválido. Confira este campo.',
      geral: 'Revise os dados profissionais ou da instituição.',
    })
  })
})
