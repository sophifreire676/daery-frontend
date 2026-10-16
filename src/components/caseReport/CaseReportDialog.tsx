import React, { useEffect, useRef, useState } from 'react'
import Button from '../Button'
import { useAsync } from '../../hooks/useApiData'
import { ApiError, createCaseNotification, getRegions } from '../../services/api'
import type { Disease } from '../../types/api'
import { AGE_RANGES, UFS } from '../../types/api'
import { friendlyError } from '../../utils/errorMessages'
import {
  AGE_RANGE_LABEL,
  CaseReportErrors,
  CaseReportForm,
  SEX_OPTIONS,
  STATUS_OPTIONS,
  apiErrorsToCaseForm,
  emptyCaseReport,
  toCasePayload,
  todayLocal,
  validateCaseReport,
} from './caseReportForm'

interface CaseReportDialogProps {
  diseases: Disease[]
  onClose: () => void
  /** Chamado depois que o servidor confirma o registro (para atualizar o mapa). */
  onCreated: () => void
}

const fieldClass = (hasError: boolean) =>
  `w-full px-3 py-2 text-sm rounded-lg border bg-white text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 disabled:bg-slate-50 ${
    hasError ? 'border-red-400' : 'border-slate-200'
  }`

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-emerald-900 mb-1">{label}</label>
      {children}
      {error && <p id={`${id}-erro`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

/** Formulário de notificação de caso (RF-001). Não coleta nenhum dado que identifique o paciente. */
export default function CaseReportDialog({ diseases, onClose, onCreated }: CaseReportDialogProps) {
  const [form, setForm] = useState<CaseReportForm>(() => emptyCaseReport())
  const [errors, setErrors] = useState<CaseReportErrors>({})
  const [saving, setSaving] = useState(false)
  const firstFieldRef = useRef<HTMLSelectElement>(null)
  const initial = useRef(emptyCaseReport())

  const regions = useAsync(signal => getRegions(form.uf, signal), `regions:${form.uf}`, !!form.uf)
  const isDirty = JSON.stringify(form) !== JSON.stringify(initial.current)

  const requestClose = () => {
    if (saving) return
    if (isDirty && !window.confirm('Descartar os dados preenchidos?')) return
    onClose()
  }

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const set = (name: keyof CaseReportForm, value: string) => {
    setForm(prev => ({ ...prev, [name]: value, ...(name === 'uf' ? { regionId: '' } : {}) }))
    setErrors(prev => ({ ...prev, [name]: undefined, geral: undefined }))
  }

  const describedBy = (name: keyof CaseReportForm) => (errors[name] ? `case-${name}-erro` : undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateCaseReport(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    try {
      await createCaseNotification(toCasePayload(form))
      onCreated()
    } catch (error) {
      const fieldErrors = error instanceof ApiError ? apiErrorsToCaseForm(error.details?.fieldErrors) : {}
      setErrors({ ...fieldErrors, geral: fieldErrors.geral ?? friendlyError(error) })
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-report-title"
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="case-report-title" className="font-sora text-lg font-semibold text-slate-800">Reportar caso</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          O caso entra na contagem "casos reportados no Daery" do município e fica registrado em seu nome.
        </p>
        <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Não informe nome, CPF, endereço ou qualquer dado que identifique o paciente.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="case-diseaseId" label="Doença *" error={errors.diseaseId}>
              <select
                id="case-diseaseId"
                ref={firstFieldRef}
                value={form.diseaseId}
                onChange={e => set('diseaseId', e.target.value)}
                aria-invalid={!!errors.diseaseId}
                aria-describedby={describedBy('diseaseId')}
                className={fieldClass(!!errors.diseaseId)}
              >
                <option value="">Selecione…</option>
                {diseases.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>

            <Field id="case-status" label="Situação do caso *" error={errors.status}>
              <select
                id="case-status"
                value={form.status}
                onChange={e => set('status', e.target.value)}
                aria-invalid={!!errors.status}
                aria-describedby={describedBy('status')}
                className={fieldClass(!!errors.status)}
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field id="case-uf" label="Estado *" error={errors.uf}>
              <select
                id="case-uf"
                value={form.uf}
                onChange={e => set('uf', e.target.value)}
                aria-invalid={!!errors.uf}
                aria-describedby={describedBy('uf')}
                className={fieldClass(!!errors.uf)}
              >
                <option value="">UF</option>
                {UFS.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </Field>

            <Field id="case-regionId" label="Município *" error={errors.regionId}>
              <select
                id="case-regionId"
                value={form.regionId}
                onChange={e => set('regionId', e.target.value)}
                disabled={!form.uf || regions.loading}
                aria-invalid={!!errors.regionId}
                aria-describedby={describedBy('regionId')}
                className={fieldClass(!!errors.regionId)}
              >
                <option value="">
                  {!form.uf ? 'Escolha o estado primeiro' : regions.loading ? 'Carregando…' : 'Selecione…'}
                </option>
                {(regions.data ?? []).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              {form.uf && !regions.loading && !regions.error && regions.data?.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">Nenhum município cadastrado neste estado.</p>
              )}
              {regions.error && <p className="mt-1 text-xs text-red-600">{regions.error}</p>}
            </Field>

            <Field id="case-patientAgeRange" label="Faixa etária *" error={errors.patientAgeRange}>
              <select
                id="case-patientAgeRange"
                value={form.patientAgeRange}
                onChange={e => set('patientAgeRange', e.target.value)}
                aria-invalid={!!errors.patientAgeRange}
                aria-describedby={describedBy('patientAgeRange')}
                className={fieldClass(!!errors.patientAgeRange)}
              >
                <option value="">Selecione…</option>
                {AGE_RANGES.map(r => (
                  <option key={r} value={r}>{AGE_RANGE_LABEL[r]}</option>
                ))}
              </select>
            </Field>

            <Field id="case-patientSex" label="Sexo *" error={errors.patientSex}>
              <select
                id="case-patientSex"
                value={form.patientSex}
                onChange={e => set('patientSex', e.target.value)}
                aria-invalid={!!errors.patientSex}
                aria-describedby={describedBy('patientSex')}
                className={fieldClass(!!errors.patientSex)}
              >
                <option value="">Selecione…</option>
                {SEX_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field id="case-notificationDate" label="Data da notificação *" error={errors.notificationDate}>
              <input
                id="case-notificationDate"
                type="date"
                max={todayLocal()}
                value={form.notificationDate}
                onChange={e => set('notificationDate', e.target.value)}
                aria-invalid={!!errors.notificationDate}
                aria-describedby={describedBy('notificationDate')}
                className={fieldClass(!!errors.notificationDate)}
              />
            </Field>

            <Field id="case-symptomsOnsetDate" label="Início dos sintomas (opcional)" error={errors.symptomsOnsetDate}>
              <input
                id="case-symptomsOnsetDate"
                type="date"
                max={form.notificationDate || todayLocal()}
                value={form.symptomsOnsetDate}
                onChange={e => set('symptomsOnsetDate', e.target.value)}
                aria-invalid={!!errors.symptomsOnsetDate}
                aria-describedby={describedBy('symptomsOnsetDate')}
                className={fieldClass(!!errors.symptomsOnsetDate)}
              />
            </Field>
          </div>

          {errors.geral && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errors.geral}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={requestClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Registrar caso
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
