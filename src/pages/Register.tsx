import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../services/api'
import { HEALTH_COUNCILS, UFS } from '../types/api'
import { maskCnpj, maskCpf } from '../utils/documents'
import { friendlyError } from '../utils/errorMessages'
import { homePathFor } from '../utils/roles'
import {
  COUNCIL_NAMES,
  EMPTY_FORM,
  ProfileType,
  RegisterErrors,
  RegisterForm,
  apiFieldErrorsToForm,
  toRegisterPayload,
  validateRegister,
} from './register/registerForm'

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Senha fraca', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Senha média', color: 'bg-amber-500' }
  if (score === 3) return { score, label: 'Senha boa', color: 'bg-teal-500' }
  return { score, label: 'Senha forte', color: 'bg-emerald-600' }
}

const PROFILE_OPTIONS: { type: ProfileType; title: string; description: string }[] = [
  { type: 'geral', title: 'População Geral', description: 'Detalhes e alertas da sua região' },
  { type: 'profissional', title: 'Profissional de Saúde', description: 'Reporte casos após a validação do registro' },
  { type: 'instituicao', title: 'Instituição', description: 'Hospitais, unidades e secretarias de saúde' },
]

const selectClass = (hasError: boolean) =>
  `w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all duration-150 ${
    hasError ? 'border-red-400' : 'border-slate-200'
  }`

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuth()

  const [profile, setProfile] = useState<ProfileType>('geral')
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<RegisterErrors>({})

  const pwStrength = getPasswordStrength(form.senha)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let processed: string | boolean = value
    if (name === 'cpf') processed = maskCpf(value)
    if (name === 'cnpj') processed = maskCnpj(value)
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') processed = e.target.checked

    setForm(prev => ({ ...prev, [name]: processed }))
    if (errors[name as keyof RegisterErrors] || errors.geral) {
      setErrors(prev => ({ ...prev, [name]: undefined, geral: undefined }))
    }
  }

  const handleRegister = async () => {
    const errs = validateRegister(form, profile)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    try {
      const user = await register(toRegisterPayload(form, profile))
      // Profissional e instituição entram como cidadão até a aprovação; a Home mostra o aviso.
      navigate(homePathFor(user.role), { replace: true })
    } catch (error) {
      const fieldErrors = error instanceof ApiError ? apiFieldErrorsToForm(error.details?.fieldErrors) : {}
      setErrors({ ...fieldErrors, geral: fieldErrors.geral ?? friendlyError(error) })
    }
  }

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') handleRegister()
  }

  return (
    <div className="flex flex-col min-h-screen font-dm">
      <nav className="bg-[#0B2D2A] px-4 sm:px-8 py-3.5 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-teal-500 flex items-center justify-center bg-teal-950">
            <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="leading-none">
            <p className="text-white font-sora font-semibold text-lg tracking-tight">Daery</p>
            <p className="text-teal-500 text-[10px] tracking-widest uppercase font-light">Vigilância Focada</p>
          </div>
        </div>

        <div className="ml-auto">
          <Link
            to="/login"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 sm:px-5 py-2 rounded-lg transition-colors duration-150"
          >
            Já tem conta? Entrar
          </Link>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-56px)] bg-slate-50 flex items-start justify-center py-8 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-9 w-full max-w-[680px] shadow-sm">
          <h1 className="font-sora text-xl font-semibold text-slate-800 mb-1">Criar conta no Daery</h1>
          <p className="text-sm text-slate-500 mb-6">Com uma conta, você vê os detalhes e os alertas da sua região.</p>

          <fieldset className="mb-6">
            <legend className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4 font-sora">
              <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Tipo de perfil
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROFILE_OPTIONS.map(option => (
                <button
                  key={option.type}
                  type="button"
                  aria-pressed={profile === option.type}
                  onClick={() => {
                    setProfile(option.type)
                    setErrors({})
                  }}
                  className={`border-[1.5px] rounded-xl py-4 px-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${
                    profile === option.type ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-semibold text-sm text-slate-800 font-sora mb-0.5">{option.title}</p>
                  <p className="text-xs text-slate-500">{option.description}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-4" onKeyDown={submitOnEnter}>
            <Input
              label={profile === 'instituicao' ? 'Nome do responsável *' : 'Nome completo *'}
              name="nome"
              placeholder="Seu nome completo"
              value={form.nome}
              onChange={handleChange}
              error={errors.nome}
              autoComplete="name"
            />
            <Input label="E-mail *" name="email" type="email" placeholder="nome@exemplo.com" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />

            <div>
              <Input
                label="Senha *"
                name="senha"
                type="password"
                placeholder="Crie uma senha forte"
                value={form.senha}
                onChange={handleChange}
                error={errors.senha}
                autoComplete="new-password"
                hint="Use pelo menos 8 caracteres, misturando letras maiúsculas, minúsculas, números ou símbolos."
              />
              {form.senha.length > 0 && (
                <div className="mt-2" aria-live="polite">
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                      style={{ width: `${(pwStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{pwStrength.label}</p>
                </div>
              )}
            </div>

            <Input
              label={profile === 'instituicao' ? 'CPF do responsável *' : 'CPF *'}
              name="cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={handleChange}
              error={errors.cpf}
              maxLength={14}
            />
          </div>

          {profile === 'profissional' && (
            <fieldset className="mt-7 pt-6 border-t border-slate-100" onKeyDown={submitOnEnter}>
              <legend className="sr-only">Informações profissionais</legend>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 font-sora mb-5" aria-hidden="true">
                <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Informações profissionais
              </div>

              <div className="space-y-4">
                <div className="w-full">
                  <label htmlFor="conselho" className="block text-sm font-medium text-emerald-900 mb-1.5">Conselho profissional *</label>
                  <select
                    id="conselho"
                    name="conselho"
                    value={form.conselho}
                    onChange={handleChange}
                    aria-invalid={!!errors.conselho}
                    aria-describedby={errors.conselho ? 'conselho-erro' : undefined}
                    className={selectClass(!!errors.conselho)}
                  >
                    <option value="">Selecione...</option>
                    {HEALTH_COUNCILS.map(council => (
                      <option key={council} value={council}>{COUNCIL_NAMES[council]}</option>
                    ))}
                  </select>
                  {errors.conselho && <p id="conselho-erro" className="mt-1.5 text-xs text-red-500">{errors.conselho}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Número de registro *" name="numeroRegistro" placeholder="Ex.: 12345" value={form.numeroRegistro} onChange={handleChange} error={errors.numeroRegistro} />
                  <div className="w-full">
                    <label htmlFor="estadoUF" className="block text-sm font-medium text-emerald-900 mb-1.5">Estado do registro *</label>
                    <select
                      id="estadoUF"
                      name="estadoUF"
                      value={form.estadoUF}
                      onChange={handleChange}
                      aria-invalid={!!errors.estadoUF}
                      aria-describedby={errors.estadoUF ? 'estadoUF-erro' : undefined}
                      className={selectClass(!!errors.estadoUF)}
                    >
                      <option value="">UF</option>
                      {UFS.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                    {errors.estadoUF && <p id="estadoUF-erro" className="mt-1.5 text-xs text-red-500">{errors.estadoUF}</p>}
                  </div>
                </div>

                <Input label="Especialidade (opcional)" name="especialidade" placeholder="Ex.: Epidemiologia, Infectologia" value={form.especialidade} onChange={handleChange} />
              </div>

              <p className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
                <strong>Validação do registro:</strong> a equipe do Daery confere o registro antes de liberar o acesso profissional. Até lá, você usa o Daery como cidadão.
              </p>
            </fieldset>
          )}

          {profile === 'instituicao' && (
            <fieldset className="mt-7 pt-6 border-t border-slate-100" onKeyDown={submitOnEnter}>
              <legend className="sr-only">Dados da instituição</legend>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 font-sora mb-5" aria-hidden="true">
                <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
                </svg>
                Dados da instituição
              </div>

              <div className="space-y-4">
                <Input label="Nome da instituição *" name="nomeInstituicao" placeholder="Ex.: Hospital Municipal de Anápolis" value={form.nomeInstituicao} onChange={handleChange} error={errors.nomeInstituicao} autoComplete="organization" />
                <Input label="CNPJ *" name="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={handleChange} error={errors.cnpj} maxLength={18} />
              </div>

              <p className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
                <strong>Validação da instituição:</strong> a equipe do Daery confere os dados antes de liberar o acesso institucional. Até lá, a conta funciona como cidadão.
              </p>
            </fieldset>
          )}

          <div className="mt-6">
            <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="aceiteTermos"
                checked={form.aceiteTermos}
                onChange={handleChange}
                aria-invalid={!!errors.aceiteTermos}
                aria-describedby="aceite-detalhe"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <span>
                Concordo com o uso dos meus dados para criar e manter minha conta
                {profile !== 'geral' ? ' e para a equipe do Daery verificar o cadastro' : ''}. *
              </span>
            </label>
            <p id="aceite-detalhe" className="ml-7 mt-1 text-xs text-slate-500">
              Tratamos seus dados conforme a LGPD. A senha é guardada de forma irreversível, e o CPF nunca é exibido completo.
            </p>
            {errors.aceiteTermos && <p className="ml-7 mt-1.5 text-xs text-red-500">{errors.aceiteTermos}</p>}
          </div>

          {errors.geral && (
            <p role="alert" className="mt-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {errors.geral}
            </p>
          )}

          <Button variant="primary" size="lg" fullWidth loading={isLoading} onClick={handleRegister} className="mt-6">
            Criar conta
          </Button>

          <p className="text-center text-sm text-slate-500 mt-5">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-teal-600 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
