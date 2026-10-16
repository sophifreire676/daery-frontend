// Lógica do formulário "Reportar caso" (RF-001), separada da tela para ser testada.
import type { AgeRange, CaseNotificationPayload, CaseStatus, PatientSex } from '../../types/api'
import { AGE_RANGES } from '../../types/api'

export interface CaseReportForm {
  diseaseId: string
  uf: string
  regionId: string
  patientAgeRange: string
  patientSex: string
  status: string
  notificationDate: string
  symptomsOnsetDate: string
}

export type CaseReportErrors = Partial<Record<keyof CaseReportForm | 'geral', string>>

export const SEX_OPTIONS: { value: PatientSex; label: string }[] = [
  { value: 'F', label: 'Feminino' },
  { value: 'M', label: 'Masculino' },
  { value: 'OTHER', label: 'Outro' },
  { value: 'UNKNOWN', label: 'Não informado' },
]

export const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: 'SUSPECTED', label: 'Suspeito' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'DISCARDED', label: 'Descartado' },
  { value: 'DEATH', label: 'Óbito' },
]

export const AGE_RANGE_LABEL: Record<AgeRange, string> = {
  '0-4': '0 a 4 anos',
  '5-9': '5 a 9 anos',
  '10-19': '10 a 19 anos',
  '20-29': '20 a 29 anos',
  '30-39': '30 a 39 anos',
  '40-49': '40 a 49 anos',
  '50-59': '50 a 59 anos',
  '60-69': '60 a 69 anos',
  '70-79': '70 a 79 anos',
  '80+': '80 anos ou mais',
  IGNORADA: 'Idade não informada',
}

/** Data local de hoje em YYYY-MM-DD (o input type="date" trabalha com a data local). */
export function todayLocal(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function emptyCaseReport(now: Date = new Date()): CaseReportForm {
  return {
    diseaseId: '',
    uf: '',
    regionId: '',
    patientAgeRange: '',
    patientSex: '',
    status: 'SUSPECTED',
    notificationDate: todayLocal(now),
    symptomsOnsetDate: '',
  }
}

export function validateCaseReport(form: CaseReportForm, now: Date = new Date()): CaseReportErrors {
  const errors: CaseReportErrors = {}
  const today = todayLocal(now)
  if (!form.diseaseId) errors.diseaseId = 'Selecione a doença.'
  if (!form.uf) errors.uf = 'Selecione o estado.'
  if (!form.regionId) errors.regionId = 'Selecione o município.'
  if (!(AGE_RANGES as readonly string[]).includes(form.patientAgeRange)) errors.patientAgeRange = 'Selecione a faixa etária.'
  if (!SEX_OPTIONS.some(o => o.value === form.patientSex)) errors.patientSex = 'Selecione o sexo.'
  if (!STATUS_OPTIONS.some(o => o.value === form.status)) errors.status = 'Selecione a situação do caso.'

  if (!form.notificationDate) errors.notificationDate = 'Informe a data da notificação.'
  else if (form.notificationDate > today) errors.notificationDate = 'A data da notificação não pode estar no futuro.'

  if (form.symptomsOnsetDate) {
    if (form.symptomsOnsetDate > today) errors.symptomsOnsetDate = 'A data dos sintomas não pode estar no futuro.'
    else if (form.notificationDate && form.symptomsOnsetDate > form.notificationDate) {
      errors.symptomsOnsetDate = 'Os sintomas precisam ter começado até a data da notificação.'
    }
  }
  return errors
}

export function toCasePayload(form: CaseReportForm): CaseNotificationPayload {
  return {
    diseaseId: form.diseaseId,
    regionId: form.regionId,
    patientAgeRange: form.patientAgeRange as AgeRange,
    patientSex: form.patientSex as PatientSex,
    status: form.status as CaseStatus,
    notificationDate: form.notificationDate,
    ...(form.symptomsOnsetDate ? { symptomsOnsetDate: form.symptomsOnsetDate } : {}),
  }
}

const API_FIELDS: (keyof CaseReportForm)[] = [
  'diseaseId', 'regionId', 'patientAgeRange', 'patientSex', 'status', 'notificationDate', 'symptomsOnsetDate',
]

/** Erros de validação do servidor nos campos correspondentes. */
export function apiErrorsToCaseForm(fieldErrors: Record<string, string[] | undefined> | undefined): CaseReportErrors {
  const errors: CaseReportErrors = {}
  for (const [field, messages] of Object.entries(fieldErrors ?? {})) {
    if (!messages?.length) continue
    if ((API_FIELDS as string[]).includes(field)) errors[field as keyof CaseReportForm] = 'Valor recusado pelo servidor. Confira este campo.'
    else errors.geral = 'O servidor recusou alguns dados. Revise o formulário.'
  }
  return errors
}
