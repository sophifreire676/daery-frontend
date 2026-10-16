// Contrato da API do Daery (back-end, Swagger em /api/docs).
// Mantenha em sincronia com src/config/swagger.ts do repositório daery-backend.

export type Role = 'ADMIN' | 'HEALTH_PROFESSIONAL' | 'RESEARCHER' | 'INSTITUTION' | 'CITIZEN'
export type VerificationStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type AccountType = 'CITIZEN' | 'HEALTH_PROFESSIONAL' | 'INSTITUTION'

export interface ApiUser {
  id: string
  name: string
  email: string
  role: Role
  requestedRole: Role | null
  verificationStatus: VerificationStatus
  /** Sempre mascarado pela API, ex.: "***.982.247-**". */
  cpf: string | null
  /** Quando o titular aceitou o termo de consentimento no cadastro (null em contas antigas ou criadas pelo admin). */
  termsAcceptedAt: string | null
  termsVersion: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** Resposta de GET/PATCH /auth/me: o usuário com os dados de cadastro profissional ou institucional. */
export interface MeResponse extends ApiUser {
  professionalRegistration: {
    council: string
    registrationNumber: string
    uf: string
    specialty: string | null
  } | null
  institution: { name: string; cnpj: string } | null
}

export interface AuthResponse {
  token: string
  user: ApiUser
}

export const HEALTH_COUNCILS = ['CRM', 'COREN', 'CRF', 'CRO', 'CREFITO', 'CRN', 'CRP', 'CRBM', 'CRFa'] as const
export type HealthCouncil = (typeof HEALTH_COUNCILS)[number]

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const
export type UF = (typeof UFS)[number]

interface RegisterBase {
  name: string
  email: string
  password: string
  cpf: string
  acceptTerms: true
}

export type RegisterPayload =
  | (RegisterBase & { accountType: 'CITIZEN' })
  | (RegisterBase & {
      accountType: 'HEALTH_PROFESSIONAL'
      professional: { council: HealthCouncil; registrationNumber: string; uf: UF; specialty?: string }
    })
  | (RegisterBase & { accountType: 'INSTITUTION'; institution: { name: string; cnpj: string } })

/** Corpo de erro padronizado da API. */
export interface ApiErrorBody {
  error: string
  details?: {
    fieldErrors?: Record<string, string[] | undefined>
    formErrors?: string[]
  }
}

export interface Disease {
  id: string
  name: string
  icdCode: string | null
  description: string | null
  category: string | null
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  monitoredByInfoDengue: boolean
}

export interface Region {
  id: string
  name: string
  uf: string
  ibgeCode: string | null
  latitude: number | null
  longitude: number | null
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/**
 * Casos reportados no Daery. Perfis profissionais recebem os números completos.
 * Visitantes e cidadãos recebem contagens de 1 a 4 como null (supressão de contagens
 * pequenas, que poderiam identificar o paciente); `suppressed` indica que algo foi omitido.
 */
export interface PlatformReports {
  suspected: number | null
  confirmed: number | null
  deaths: number | null
  suppressed: boolean
}

export interface SummaryItem {
  regionId: string
  regionName: string
  uf: string
  latitude: number | null
  longitude: number | null
  diseaseId: string
  diseaseName: string
  totalCases: number
  estimatedCases: number | null
  latestWeekStart: string | null
  latestEpiWeek: number | null
  latestAlertLevel: number | null
  severity: Severity | null
  platformReports: PlatformReports
  sources: string[]
  includesDemoData: boolean
}

export interface SummaryResponse {
  period: { startDate: string; endDate: string }
  generatedAt: string
  items: SummaryItem[]
}

export interface Alert {
  id: string
  regionId: string
  regionName: string
  uf: string
  latitude: number | null
  longitude: number | null
  diseaseId: string
  diseaseName: string
  alertLevel: number
  severity: Severity
  epiWeek: number | null
  weekStart: string
  title: string
  message: string
  recommendations: string[]
  source: string
  /** true quando o alerta vem de dados fictícios de demonstração. */
  isDemo: boolean
}

export interface SummaryFilters {
  diseaseId?: string
  regionId?: string
  uf?: string
  /** YYYY-MM-DD */
  startDate?: string
  /** YYYY-MM-DD */
  endDate?: string
}

export const AGE_RANGES = ['0-4', '5-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+', 'IGNORADA'] as const
export type AgeRange = (typeof AGE_RANGES)[number]
export type PatientSex = 'M' | 'F' | 'OTHER' | 'UNKNOWN'
export type CaseStatus = 'SUSPECTED' | 'CONFIRMED' | 'DISCARDED' | 'DEATH'

/** Corpo de POST /case-notifications (o autor vem do token). */
export interface CaseNotificationPayload {
  diseaseId: string
  regionId: string
  patientAgeRange: AgeRange
  patientSex: PatientSex
  status?: CaseStatus
  /** YYYY-MM-DD */
  notificationDate?: string
  /** YYYY-MM-DD */
  symptomsOnsetDate?: string
}

export interface CaseNotification extends Omit<CaseNotificationPayload, 'notificationDate' | 'symptomsOnsetDate'> {
  id: string
  reportedById: string
  status: CaseStatus
  notificationDate: string
  symptomsOnsetDate: string | null
  createdAt: string
}

export interface AlertFilters {
  diseaseId?: string
  regionId?: string
  uf?: string
  minLevel?: number
  weeks?: number
}
