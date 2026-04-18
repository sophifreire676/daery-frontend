import React, { useState, useEffect, useRef } from 'react'
import RealMap from '../components/RealMap'
import { useNavigate } from 'react-router-dom'
import { useGeolocation } from '../hooks/useGeolocation'

interface Outbreak {
  id: number
  city: string
  state: string
  disease: string
  cases: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  lat: number
  lng: number
  lastUpdate: string
}

const PUBLIC_OUTBREAKS = [
  {
    id: 1,
    city: 'São Paulo',
    state: 'SP',
    disease: 'Dengue',
    cases: 1284,
    severity: 'critical' as const,
    lat: -23.5505,
    lng: -46.6333,
    lastUpdate: '2 horas atrás',
  },
  {
    id: 2,
    city: 'Rio de Janeiro',
    state: 'RJ',
    disease: 'Chikungunya',
    cases: 432,
    severity: 'high' as const,
    lat: -22.9068,
    lng: -43.1729,
    lastUpdate: '1 hora atrás',
  },
  {
    id: 3,
    city: 'Brasília',
    state: 'DF',
    disease: 'Dengue',
    cases: 215,
    severity: 'medium' as const,
    lat: -15.7942,
    lng: -47.8822,
    lastUpdate: '3 horas atrás',
  },
]

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Crítico',
  high:     'Alto',
  medium:   'Médio',
  low:      'Baixo',
}




type Ripple = { x: number; y: number; r: number; alpha: number; speed: number; color: string }

function EpiMap({ outbreaks }: { outbreaks: Outbreak[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const ripplesRef = useRef<Ripple[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const addRipple = () => {
      const ob = outbreaks[Math.floor(Math.random() * outbreaks.length)]
      ripplesRef.current.push({
        x: ob.lat, y: ob.lng,
        r: 0, alpha: 0.8, speed: 0.5 + Math.random() * 0.4,
        color: SEVERITY_COLOR[ob.severity],
      })
    }
    const interval = setInterval(addRipple, 500)

    const draw = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const w = canvas.width, h = canvas.height

      ctx.fillStyle = '#071a12'
      ctx.fillRect(0, 0, w, h)

      // Grid
      ctx.strokeStyle = 'rgba(13,158,117,0.05)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < w; x += 28) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h; y += 28) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }

      outbreaks.forEach(ob => {
        const px = ob.lat * w, py = ob.lng * h
        const color = SEVERITY_COLOR[ob.severity]
       
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 18)
        grd.addColorStop(0, color + '40')
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill()
      
        ctx.beginPath()
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      })

      const ripples = ripplesRef.current
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        ctx.beginPath()
        ctx.arc(rp.x * w, rp.y * h, rp.r, 0, Math.PI * 2)
        ctx.strokeStyle = rp.color + Math.round(rp.alpha * 255).toString(16).padStart(2,'0')
        ctx.lineWidth = 1.5
        ctx.stroke()
        rp.r     += rp.speed
        rp.alpha -= 0.014
        if (rp.alpha <= 0) ripples.splice(i, 1)
      }

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { clearInterval(interval); cancelAnimationFrame(animRef.current) }
  }, [outbreaks])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}


function DaeryLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full border-2 border-teal-500 flex items-center justify-center bg-teal-950">
        <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <div className="leading-none">
        <p className="text-white font-sora font-semibold text-base tracking-tight">Daery</p>
        <p className="text-teal-500 text-[9px] tracking-widest uppercase font-light">Vigilância Focada</p>
      </div>
    </div>
  )
}


export default function HomePublic() {
  const navigate = useNavigate()
  const onLogin = () => navigate('/login')
  const onRegister = () => navigate('/register')
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [viewMode, setViewMode]         = useState<'markers' | 'heatmap'>('markers')

  const { status: geoStatus, coords: userCoords } = useGeolocation()
  const totalCases = PUBLIC_OUTBREAKS.reduce((acc, o) => acc + o.cases, 0)
  const criticalCount = PUBLIC_OUTBREAKS.filter(o => o.severity === 'critical').length
  const diseaseCount  = new Set(PUBLIC_OUTBREAKS.map(o => o.disease)).size

  const filtered = PUBLIC_OUTBREAKS.filter(o => {
    const matchFilter = activeFilter === 'all' || o.severity === activeFilter
    const matchSearch = searchQuery === '' ||
      o.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.disease.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchSearch
  })

  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-dm">

      {/* ── Navbar ── */}
      <nav className="bg-[#0B2D2A] px-6 py-3 flex items-center gap-4 sticky top-0 z-30 shadow-lg">
        <DaeryLogo />

        {/* Search */}
        <div className="flex-1 max-w-md mx-4 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar doenças, regiões..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:bg-white/15 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Warning banner */}
          {criticalCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-300 text-xs px-3 py-1.5 rounded-lg">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/><path d="M12 17h.01"/>
              </svg>
              {criticalCount} surto{criticalCount > 1 ? 's' : ''} crítico{criticalCount > 1 ? 's' : ''}
            </div>
          )}

          <button
            onClick={onLogin}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Entrar
          </button>

          <button
            onClick={onRegister}
            className="border border-white/20 hover:border-teal-400/50 text-white hover:text-teal-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Reportar caso
          </button>
        </div>
      </nav>

      {/* ── Geolocation status banner (seção 16.1.3 e 16.1.4) ── */}
      {(geoStatus === 'idle' || geoStatus === 'loading') && (
        <div className="bg-teal-50 border-b border-teal-200 px-6 py-2.5 flex items-center gap-2 text-teal-700 text-sm">
          <svg className="w-4 h-4 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span>Solicitando acesso à sua localização para personalizar o mapa...</span>
        </div>
      )}
      {geoStatus === 'granted' && userCoords && (
        <div className="bg-teal-50 border-b border-teal-200 px-6 py-2.5 flex items-center gap-2 text-teal-700 text-sm">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span>Localização obtida — exibindo surtos próximos à sua região ({userCoords[0].toFixed(2)}, {userCoords[1].toFixed(2)}).</span>
        </div>
      )}
      {geoStatus === 'denied' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-amber-700 text-sm">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
          </svg>
          <span>Permissão de localização negada. Exibindo mapa geral do Brasil.</span>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-6 overflow-x-auto">
        {[
          { label: 'Total de Casos',    value: totalCases.toLocaleString('pt-BR'), icon: '📊', iconColor: 'text-teal-500' },
          { label: 'Doenças ativas',    value: diseaseCount, icon: '🦠', iconColor: 'text-emerald-500' },
          { label: 'Surtos Críticos',   value: criticalCount, icon: '⚠️', iconColor: 'text-red-500' },
          { label: 'Última Atualização', value: timeStr, icon: '🕐', iconColor: 'text-slate-400' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 shrink-0 pr-6 border-r border-slate-100 last:border-0">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">{stat.label}</span>
              <span className="text-xl font-sora font-bold text-slate-800">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* ── Sidebar ── */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sora font-semibold text-slate-700 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filtros
              </h2>
            </div>

            {/* View mode */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Modo de Visualização</p>
              <div className="flex gap-2">
                {(['markers', 'heatmap'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-all ${
                      viewMode === mode
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    {mode === 'markers' ? 'Marcadores' : 'Heatmap'}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity filter */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Severidade</p>
              <div className="space-y-1.5">
                {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setActiveFilter(activeFilter === sev ? 'all' : sev)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                      activeFilter === sev ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[sev] }} />
                    <span className="text-slate-600">{SEVERITY_LABEL[sev]}</span>
                    <span className="ml-auto text-slate-400">
                      {PUBLIC_OUTBREAKS.filter(o => o.severity === sev).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Período</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-400">Data Inicial</label>
                  <input type="date" className="w-full mt-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Data Final</label>
                  <input type="date" className="w-full mt-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-teal-400" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA for unauthenticated */}
          <div className="p-4 mt-auto border-t border-slate-100 bg-gradient-to-br from-teal-50 to-emerald-50">
            <div className="flex items-start gap-2.5 mb-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 font-sora">Acesso completo</p>
                <p className="text-xs text-slate-500 mt-0.5">Filtros avançados, alertas e exportação de dados</p>
              </div>
            </div>
            <button
              onClick={onRegister}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors font-sora"
            >
              Criar conta gratuita
            </button>
            <button
              onClick={onLogin}
              className="w-full mt-1.5 text-teal-600 hover:underline text-xs py-1"
            >
              Já tenho uma conta
            </button>
          </div>
        </aside>

        {/* ── Map + List ── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Map */}
          <div className="relative flex-1 bg-[#071a12] overflow-hidden h-[420px] w-full">
            <RealMap
              outbreaks={PUBLIC_OUTBREAKS.map(o => ({ ...o, coordinates: [o.lat, o.lng] as [number, number] }))}
              center={userCoords ?? undefined}
              zoom={userCoords ? 8 : 4}
            />

            {/* Map label */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-sora font-semibold z-[500]">
              Mapa de Surtos Epidemiológicos
            </div>

            {/* Map legend */}
            <div className="absolute bottom-3 left-3 text-white/70 text-xs bg-black/40 px-2.5 py-1 rounded-lg z-[500]">
              {PUBLIC_OUTBREAKS.length} surtos encontrados
            </div>

            {/* Count badge */}
            <div className="absolute bottom-3 left-3 text-white/70 text-xs bg-black/40 px-2.5 py-1 rounded-lg">
              {filtered.length} surtos encontrados &nbsp;·&nbsp; {filtered.reduce((a, o) => a + o.cases, 0).toLocaleString('pt-BR')} casos totais
            </div>
          </div>

          {/* Outbreak list */}
          <div className="h-48 bg-white border-t border-slate-200 overflow-x-auto">
            <div className="flex h-full divide-x divide-slate-100">
              {filtered.slice(0, 6).map(ob => (
                <div key={ob.id} className="min-w-[200px] p-3 flex flex-col gap-1 hover:bg-slate-50 transition-colors cursor-default">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[ob.severity] }} />
                    <span className="font-sora font-semibold text-slate-800 text-sm truncate">{ob.city}</span>
                    <span className="text-slate-400 text-xs">– {ob.state}</span>
                  </div>
                  <p className="text-teal-600 text-xs font-medium">{ob.disease}</p>
                  <p className="text-slate-700 text-lg font-bold font-sora leading-tight">{ob.cases.toLocaleString('pt-BR')}</p>
                  <p className="text-slate-400 text-[11px]">casos · {ob.lastUpdate}</p>
                  <span className="inline-block mt-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: SEVERITY_COLOR[ob.severity] + '20', color: SEVERITY_COLOR[ob.severity] }}>
                    {SEVERITY_LABEL[ob.severity]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
