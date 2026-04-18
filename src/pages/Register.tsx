import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import logoDaery from '../assets/logo-daery.png'

type ProfileType = 'geral' | 'profissional'

interface RegisterForm {
  nome: string
  email: string
  senha: string
  cpf: string
  tipoRegistro: string
  numeroRegistro: string
  estadoUF: string
  especialidade: string
}

interface RegisterErrors {
  nome?: string
  email?: string
  senha?: string
  cpf?: string
  tipoRegistro?: string
  numeroRegistro?: string
  estadoUF?: string
}

function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

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

function validate(form: RegisterForm, profile: ProfileType): RegisterErrors {
  const errors: RegisterErrors = {}

  if (!form.nome.trim()) errors.nome = 'Nome obrigatório'
  if (!form.email) errors.email = 'Email obrigatório'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email inválido'

  if (!form.senha) errors.senha = 'Senha obrigatória'
  else if (form.senha.length < 8) errors.senha = 'A senha deve ter pelo menos 8 caracteres'

  if (!form.cpf) errors.cpf = 'CPF obrigatório'
  else if (form.cpf.replace(/\D/g, '').length !== 11) errors.cpf = 'CPF inválido'

  if (profile === 'profissional') {
    if (!form.tipoRegistro) errors.tipoRegistro = 'Selecione o tipo de registro'
    if (!form.numeroRegistro) errors.numeroRegistro = 'Número obrigatório'
    if (!form.estadoUF) errors.estadoUF = 'UF obrigatória'
  }

  return errors
}

export default function Register() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()

  const [profile, setProfile] = useState<ProfileType>('geral')
  const [form, setForm] = useState<RegisterForm>({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    tipoRegistro: '',
    numeroRegistro: '',
    estadoUF: '',
    especialidade: '',
  })
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [toast, setToast] = useState<string | null>(null)

  const pwStrength = getPasswordStrength(form.senha)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const processed = name === 'cpf' ? maskCPF(value) : value

    setForm(prev => ({ ...prev, [name]: processed }))

    if (errors[name as keyof RegisterErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleRegister = async () => {
    const errs = validate(form, profile)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    try {
      const targetRole = profile === 'profissional' ? 'researcher' : 'public'

      await login(form.email, form.senha, {
        roleHint: targetRole,
        displayName: targetRole === 'researcher' ? 'Drauzio Varella' : form.nome,
      })

      showToast('Conta criada com sucesso!')

      navigate(targetRole === 'researcher' ? '/home-professional' : '/home-public', {
        replace: true,
      })
    } catch {
      showToast('Erro ao criar conta. Tente novamente.')
    }
  }

  return (
    <div className="flex flex-col min-h-screen font-dm">
      <nav className="bg-[#0B2D2A] px-8 py-3.5 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-teal-500 flex items-center justify-center bg-teal-950">
            <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
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
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors duration-150"
          >
            Já tem uma conta? Faça login
          </Link>
        </div>
      </nav>

      <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex items-start justify-center py-8 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-9 w-full max-w-[680px] shadow-sm">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-7 text-sm text-emerald-800">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>
              <strong>Cadastro obrigatório</strong> para acesso a notificações personalizadas e configurações de raio de alerta.
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-4 font-sora">
            <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Tipo de perfil
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['geral', 'profissional'] as ProfileType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setProfile(type)}
                className={`border-[1.5px] rounded-xl py-4 px-5 text-left transition-all duration-150 ${
                  profile === type ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="font-semibold text-sm text-slate-800 font-sora mb-0.5">
                  {type === 'geral' ? 'População Geral' : 'Profissional de Saúde'}
                </p>
                <p className="text-xs text-slate-500">
                  {type === 'geral' ? 'Acesso a alertas e notificações' : 'Acesso avançado com validação'}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Input label="Nome completo *" name="nome" placeholder="Seu nome completo" value={form.nome} onChange={handleChange} error={errors.nome} />
            <Input label="Email *" name="email" type="email" placeholder="Insira seu email" value={form.email} onChange={handleChange} error={errors.email} />

            <div>
              <Input label="Senha *" name="senha" type="password" placeholder="Crie uma senha forte" value={form.senha} onChange={handleChange} error={errors.senha} />
              {form.senha.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`}
                      style={{ width: `${(pwStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  {pwStrength.label && <p className="text-xs text-slate-500 mt-1">{pwStrength.label}</p>}
                </div>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos
              </p>
            </div>

            <Input label="CPF *" name="cpf" placeholder="000.000.000-00" value={form.cpf} onChange={handleChange} error={errors.cpf} maxLength={14} />
          </div>

          {profile === 'profissional' && (
            <div className="mt-7 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 font-sora mb-5">
                <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Informações Profissionais
              </div>

              <div className="space-y-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-emerald-900 mb-1.5">Tipo de registro *</label>
                  <select
                    name="tipoRegistro"
                    value={form.tipoRegistro}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 transition-all duration-150"
                  >
                    <option value="">Selecione...</option>
                    <option>CRM — Conselho Regional de Medicina</option>
                    <option>COREN — Conselho Regional de Enfermagem</option>
                    <option>CRF — Conselho Regional de Farmácia</option>
                    <option>CREFITO — Fisioterapia e Terapia Ocupacional</option>
                    <option>Outro</option>
                  </select>
                  {errors.tipoRegistro && <p className="mt-1.5 text-xs text-red-500">{errors.tipoRegistro}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Número de registro *" name="numeroRegistro" placeholder="Número do registro" value={form.numeroRegistro} onChange={handleChange} error={errors.numeroRegistro} />
                  <Input label="Estado (UF) *" name="estadoUF" placeholder="Ex: SP" value={form.estadoUF} onChange={handleChange} error={errors.estadoUF} maxLength={2} />
                </div>

                <Input label="Especialidade (opcional)" name="especialidade" placeholder="Ex: Epidemiologia, Infectologia..." value={form.especialidade} onChange={handleChange} />
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
                <strong>Validação Profissional:</strong> Seu registro profissional será validado pela equipe do Daery. Você terá acesso completo ao sistema após a aprovação.
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 bg-teal-50/70 border border-teal-200/70 rounded-lg px-4 py-3 mt-6 mb-5 text-xs text-teal-800">
            <svg className="w-3.5 h-3.5 shrink-0 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Seus dados são criptografados e protegidos conforme a LGPD.
          </div>

          <Button variant="primary" size="lg" fullWidth loading={isLoading} onClick={handleRegister}>
            Criar conta
          </Button>

          <p className="text-center text-xs text-slate-400 mt-4">
            Ao criar uma conta, você concorda com nossos{' '}
            <span className="text-teal-600 cursor-pointer hover:underline">Termos de Uso e Política de Privacidade</span>
          </p>

          <p className="text-center text-sm text-slate-500 mt-4">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-teal-600 font-medium hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#0B2D2A] text-white px-5 py-3.5 rounded-xl text-sm shadow-xl z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}