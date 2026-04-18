import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'

interface ForgotPasswordErrors {
  email?: string
}

function validate(email: string): ForgotPasswordErrors {
  const errors: ForgotPasswordErrors = {}
  if (!email) errors.email = 'Email obrigatório'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido'
  return errors
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<ForgotPasswordErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const handleSubmit = async () => {
    const validation = validate(email)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setErrors({})
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1200))

    setIsLoading(false)
    setIsFinished(true)
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
            Voltar ao login
          </Link>
        </div>
      </nav>

      <div className="min-h-[calc(100vh-56px)] bg-slate-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-9 w-full max-w-[520px] shadow-sm">
          {!isFinished ? (
            <>
              <div className="flex items-center gap-2.5 mb-1">
                <svg className="w-5 h-5 text-teal-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 16v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <h1 className="font-sora text-xl font-semibold text-slate-800">Esqueci minha senha</h1>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                Informe seu email para receber as instruções de recuperação de senha.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
                Por enquanto este fluxo está em modo front-end. O envio do email será integrado ao backend depois.
              </div>

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Insira seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
              />

              <div className="mt-6">
                <Button variant="primary" size="lg" fullWidth loading={isLoading} onClick={handleSubmit}>
                  Enviar instruções
                </Button>
              </div>

              <p className="text-center text-sm text-slate-500 mt-5">
                Lembrou da senha?{' '}
                <Link to="/login" className="text-teal-600 font-medium hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h1 className="font-sora text-xl font-semibold text-slate-800">Solicitação enviada</h1>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                Se existir uma conta vinculada ao email <strong>{email}</strong>, você receberá as instruções para redefinir sua senha.
              </p>

              <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 mb-6 text-sm text-teal-800">
                Verifique também sua caixa de spam ou lixo eletrônico.
              </div>

              <div className="space-y-3">
                <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/login')}>
                  Voltar para o login
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFinished(false)
                    setEmail('')
                    setErrors({})
                  }}
                  className="w-full border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium px-4 py-3 rounded-lg transition-colors duration-150"
                >
                  Enviar novamente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}