import { describe, expect, it } from 'vitest'
import {
  apiErrorsToCaseForm,
  emptyCaseReport,
  toCasePayload,
  todayLocal,
  validateCaseReport,
} from '../components/caseReport/caseReportForm'

const NOW = new Date(2026, 9, 9, 15, 0) // 09/10/2026 15h, horário local

const filled = {
  ...emptyCaseReport(NOW),
  diseaseId: 'd-den',
  uf: 'GO',
  regionId: 'r-ana',
  patientAgeRange: '20-29',
  patientSex: 'F',
}

describe('emptyCaseReport', () => {
  it('starts as a suspected case notified today (local date)', () => {
    expect(emptyCaseReport(NOW)).toMatchObject({ status: 'SUSPECTED', notificationDate: '2026-10-09' })
    expect(todayLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('validateCaseReport', () => {
  it('accepts a complete report', () => {
    expect(validateCaseReport(filled, NOW)).toEqual({})
  })

  it('requires disease, place, age range and sex', () => {
    expect(Object.keys(validateCaseReport(emptyCaseReport(NOW), NOW)).sort()).toEqual(
      ['diseaseId', 'patientAgeRange', 'patientSex', 'regionId', 'uf'].sort()
    )
  })

  it('rejects future dates and symptoms after the notification', () => {
    expect(validateCaseReport({ ...filled, notificationDate: '2026-10-10' }, NOW).notificationDate).toMatch(/futuro/)
    expect(validateCaseReport({ ...filled, notificationDate: '2026-10-01', symptomsOnsetDate: '2026-10-05' }, NOW).symptomsOnsetDate).toMatch(/até a data/)
    expect(validateCaseReport({ ...filled, notificationDate: '2026-10-05', symptomsOnsetDate: '2026-10-01' }, NOW)).toEqual({})
  })
})

describe('toCasePayload', () => {
  it('builds the API body without the UF and without empty optional dates', () => {
    expect(toCasePayload(filled)).toEqual({
      diseaseId: 'd-den',
      regionId: 'r-ana',
      patientAgeRange: '20-29',
      patientSex: 'F',
      status: 'SUSPECTED',
      notificationDate: '2026-10-09',
    })
  })
})

describe('apiErrorsToCaseForm', () => {
  it('maps server field errors to the form', () => {
    expect(apiErrorsToCaseForm({ symptomsOnsetDate: ['x'], reportedById: ['Unrecognized'] })).toEqual({
      symptomsOnsetDate: 'Valor recusado pelo servidor. Confira este campo.',
      geral: 'O servidor recusou alguns dados. Revise o formulário.',
    })
  })
})
