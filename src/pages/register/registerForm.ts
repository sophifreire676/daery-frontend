// Lógica do formulário de cadastro, separada da tela para poder ser testada.
import type { HealthCouncil, RegisterPayload, UF } from '../../types/api'
import { HEALTH_COUNCILS, UFS } from '../../types/api'
import { isValidCnpj, isValidCpf, onlyDigits } from '../../utils/documents'

export type ProfileType = 'geral' | 'profissional' | 'instituicao'

export interface RegisterForm {
  nome: string
  email: string
  senha: string
  cpf: string
  conselho: string
  numeroRegistro: string
  estadoUF: string
  especialidade: string
  nomeInstituicao: string
  cnpj: string
  aceiteTermos: boolean
}

export type RegisterErrors = Partial<Record<keyof RegisterForm | 'geral', string>>

export const EMPTY_FORM: RegisterForm = {
  nome: '',
  email: '',
  senha: '',
  cpf: '',
  conselho: '',
  numeroRegistro: '',
  estadoUF: '',
  especialidade: '',
  nomeInstituicao: '',
  cnpj: '',
  aceiteTermos: false,
}

export const COUNCIL_NAMES: Record<HealthCouncil, string> = {
  CRM: 'CRM — Medicina',
  COREN: 'COREN — Enfermagem',
  CRF: 'CRF — Farmácia',
  CRO: 'CRO — Odontologia',
  CREFITO: 'CREFITO — Fisioterapia e Terapia Ocupacional',
  CRN: 'CRN — Nutrição',
  CRP: 'CRP — Psicologia',
  CRBM: 'CRBM — Biomedicina',
  CRFa: 'CRFa — Fonoaudiologia',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegister(form: RegisterForm, profile: ProfileType): RegisterErrors {
  const errors: RegisterErrors = {}

  if (!form.nome.trim()) errors.nome = 'Informe seu nome completo.'
  if (!form.email.trim()) errors.email = 'Informe seu e-mail.'
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Informe um e-mail válido, como nome@exemplo.com.'

  if (!form.senha) errors.senha = 'Crie uma senha.'
  else if (form.senha.length < 8) errors.senha = 'A senha precisa ter pelo menos 8 caracteres.'
  else if (form.senha.length > 72) errors.senha = 'A senha pode ter no máximo 72 caracteres.'

  if (!form.cpf) errors.cpf = 'Informe seu CPF.'
  else if (!isValidCpf(form.cpf)) errors.cpf = 'CPF inválido. Confira os números digitados.'

  if (profile === 'profissional') {
    if (!(HEALTH_COUNCILS as readonly string[]).includes(form.conselho)) errors.conselho = 'Selecione o conselho profissional.'
    if (!/^[0-9A-Za-z-]{1,20}$/.test(form.numeroRegistro.trim())) {
      errors.numeroRegistro = 'Informe o número do registro (até 20 letras ou números).'
    }
    if (!(UFS as readonly string[]).includes(form.estadoUF)) errors.estadoUF = 'Selecione o estado do registro.'
  }

  if (profile === 'instituicao') {
    if (!form.nomeInstituicao.trim()) errors.nomeInstituicao = 'Informe o nome da instituição.'
    if (!form.cnpj) errors.cnpj = 'Informe o CNPJ.'
    else if (!isValidCnpj(form.cnpj)) errors.cnpj = 'CNPJ inválido. Confira os números digitados.'
  }

  if (!form.aceiteTermos) errors.aceiteTermos = 'Para criar a conta, é preciso concordar com o uso dos dados.'

  return errors
}

/** Monta o corpo de POST /api/auth/register a partir do formulário já validado. */
export function toRegisterPayload(form: RegisterForm, profile: ProfileType): RegisterPayload {
  const base = {
    name: form.nome.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.senha,
    cpf: onlyDigits(form.cpf),
    acceptTerms: true as const,
  }
  if (profile === 'profissional') {
    return {
      ...base,
      accountType: 'HEALTH_PROFESSIONAL',
      professional: {
        council: form.conselho as HealthCouncil,
        registrationNumber: form.numeroRegistro.trim(),
        uf: form.estadoUF as UF,
        ...(form.especialidade.trim() ? { specialty: form.especialidade.trim() } : {}),
      },
    }
  }
  if (profile === 'instituicao') {
    return {
      ...base,
      accountType: 'INSTITUTION',
      institution: { name: form.nomeInstituicao.trim(), cnpj: onlyDigits(form.cnpj) },
    }
  }
  return { ...base, accountType: 'CITIZEN' }
}

// Campo da API → campo do formulário, para mostrar os erros de validação do servidor no lugar certo.
const API_FIELD_TO_FORM: Record<string, keyof RegisterForm> = {
  name: 'nome',
  email: 'email',
  password: 'senha',
  cpf: 'cpf',
  acceptTerms: 'aceiteTermos',
}

export function apiFieldErrorsToForm(fieldErrors: Record<string, string[] | undefined> | undefined): RegisterErrors {
  const errors: RegisterErrors = {}
  for (const [field, messages] of Object.entries(fieldErrors ?? {})) {
    if (!messages?.length) continue
    const formField = API_FIELD_TO_FORM[field]
    if (formField) errors[formField] = 'Valor inválido. Confira este campo.'
    else errors.geral = 'Revise os dados profissionais ou da instituição.'
  }
  return errors
}
