import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

interface LoginForm { email: string; password: string }
interface LoginErrors { email?: string; password?: string }

function validate(form: LoginForm): LoginErrors {
  const errors: LoginErrors = {}
  if (!form.email) errors.email = 'Email obrigatório'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email inválido'
  if (!form.password) errors.password = 'Senha obrigatória'
  return errors
}

function resolveRoleByEmail(email: string) {
  const normalizedEmail = email.toLowerCase()
  return (
    normalizedEmail.includes('pesquisador') ||
    normalizedEmail.includes('researcher') ||
    normalizedEmail.includes('medic') ||
    normalizedEmail.includes('dr.')
  )
    ? 'researcher'
    : 'public'
}

const MAP_DOTS = [
  [0.12, 0.35], [0.13, 0.42], [0.18, 0.38], [0.22, 0.30], [0.25, 0.36], [0.28, 0.42], [0.30, 0.55],
  [0.32, 0.48], [0.35, 0.40], [0.22, 0.60], [0.18, 0.65], [0.25, 0.70], [0.32, 0.68], [0.20, 0.72],
  [0.28, 0.75], [0.45, 0.28], [0.50, 0.32], [0.52, 0.35], [0.55, 0.28], [0.58, 0.25], [0.60, 0.32],
  [0.62, 0.38], [0.65, 0.35], [0.68, 0.30], [0.72, 0.35], [0.75, 0.42], [0.78, 0.38], [0.80, 0.32],
  [0.50, 0.42], [0.55, 0.50], [0.60, 0.55], [0.65, 0.48], [0.70, 0.55], [0.75, 0.60], [0.58, 0.60],
  [0.62, 0.65], [0.68, 0.68], [0.72, 0.62], [0.80, 0.55], [0.85, 0.50], [0.88, 0.42], [0.90, 0.50],
  [0.92, 0.55], [0.30, 0.25], [0.35, 0.30],
]

type Ripple = { x: number; y: number; r: number; alpha: number; speed: number }

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const ripplesRef = useRef<Ripple[]>([])

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginErrors>({})
  const [showPass, setShowPass] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleLogin = async () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    try {
      const resolvedRole = resolveRoleByEmail(form.email)
      await login(form.email, form.password)
      showToast('Login realizado com sucesso!')
      navigate(resolvedRole === 'researcher' ? '/home-professional' : '/home-public', { replace: true })
    } catch {
      showToast('Credenciais inválidas. Tente novamente.', 'error')
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    const interval = setInterval(() => {
      const d = MAP_DOTS[Math.floor(Math.random() * MAP_DOTS.length)]
      ripplesRef.current.push({
        x: d[0],
        y: d[1],
        r: 0,
        alpha: 0.7,
        speed: 0.4 + Math.random() * 0.3,
      })
    }, 600)

    const draw = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const w = canvas.width
      const h = canvas.height

      ctx.fillStyle = '#0B2D2A'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = '#2e7b7721'
      ctx.lineWidth = 0.5

      for (let x = 0; x < w; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      for (let y = 0; y < h; y += 30) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      MAP_DOTS.forEach(([fx, fy]) => {
        ctx.beginPath()
        ctx.arc(fx * w, fy * h, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = '#2a9d9d'
        ctx.fill()
      })

      const ripples = ripplesRef.current
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        ctx.beginPath()
        ctx.arc(rp.x * w, rp.y * h, rp.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(29,158,117,${rp.alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
        rp.r += rp.speed
        rp.alpha -= 0.012

        if (rp.alpha <= 0) {
          ripples.splice(i, 1)
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      clearInterval(interval)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

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
            to="/register"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors duration-150"
          >
            Criar conta
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 min-h-[calc(100vh-56px)]">
        <div className="hidden lg:block w-[55%] bg-[#0B2D2A] relative overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-[#0B2D2A]/20 pointer-events-none" />
          <div className="absolute bottom-10 left-10 text-white z-10">
            <h2 className="font-sora text-2xl font-semibold mb-1.5">Vigilância em tempo real</h2>
            <p className="text-teal-400/80 text-sm">Monitoramento epidemiológico georreferenciado</p>
          </div>
        </div>

        <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-slate-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-10 w-full max-w-[480px] shadow-sm">
            <div className="flex items-center gap-2.5 mb-1">
              <svg className="w-5 h-5 text-teal-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <h1 className="font-sora text-xl font-semibold text-slate-800">Acessar Sistema Daery</h1>
            </div>

            <p className="text-sm text-slate-500 mb-5">Monitoramento epidemiológico em tempo real</p>

            <div className="space-y-4" onKeyDown={e => e.key === 'Enter' && handleLogin()}>
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Insira seu email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
              />

              <Input
                label="Senha"
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••••"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                }
              />
            </div>

            <Link to="/forgot-password" className="block text-right text-sm text-teal-600 hover:underline mt-3 mb-5 ml-auto">
              Esqueci minha senha
            </Link>

            <Button variant="primary" size="lg" fullWidth loading={isLoading} onClick={handleLogin}>
              Entrar
            </Button>

            <p className="text-center text-sm text-slate-500 mt-5">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-teal-600 font-medium hover:underline">
                Faça seu cadastro
              </Link>
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3.5 rounded-xl text-sm shadow-xl z-50 text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-[#0B2D2A]'}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  )
}