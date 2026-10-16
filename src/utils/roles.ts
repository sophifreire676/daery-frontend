import type { Role, VerificationStatus } from '../types/api'

// Perfis que veem a Home 2 (decisão D2 da equipe, 09/10/2026).
const PROFESSIONAL_HOME_ROLES: Role[] = ['HEALTH_PROFESSIONAL', 'INSTITUTION', 'RESEARCHER', 'ADMIN']

// Perfis que podem reportar casos (mesma regra aplicada pelo back-end).
const REPORTING_ROLES: Role[] = ['HEALTH_PROFESSIONAL', 'INSTITUTION']

// Perfis que podem exportar dados (RF-005: pesquisadores autorizados; o ADMIN também).
// Separado do acesso à Home 2: profissionais e instituições veem os dados, mas não exportam.
const EXPORT_ROLES: Role[] = ['RESEARCHER', 'ADMIN']

export function canExportData(role: Role | undefined | null): boolean {
  return !!role && EXPORT_ROLES.includes(role)
}

export function canAccessProfessionalHome(role: Role | undefined | null): boolean {
  return !!role && PROFESSIONAL_HOME_ROLES.includes(role)
}

export function canReportCases(role: Role | undefined | null): boolean {
  return !!role && REPORTING_ROLES.includes(role)
}

export function homePathFor(role: Role | undefined | null): string {
  return canAccessProfessionalHome(role) ? '/home-professional' : '/home-public'
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  HEALTH_PROFESSIONAL: 'Profissional de saúde',
  RESEARCHER: 'Pesquisador',
  INSTITUTION: 'Instituição',
  CITIZEN: 'Cidadão',
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role]
}

/** Texto do status do cadastro de profissional/instituição; null quando não há o que mostrar. */
export function verificationLabel(status: VerificationStatus, requestedRole: Role | null): string | null {
  const what = requestedRole === 'INSTITUTION' ? 'da instituição' : 'profissional'
  if (status === 'PENDING') return `Cadastro ${what} em análise`
  if (status === 'REJECTED') return `Cadastro ${what} não aprovado`
  return null
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
