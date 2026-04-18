import RealMap from '../components/RealMap'
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../hooks/useGeolocation'

interface Outbreak {
  lng: number
  lat: number
  id: number
  city: string
  state: string
  disease: string
  cases: number
  newCases: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  coordinates: [number, number]
  lastUpdate: string
  trend: 'up' | 'down' | 'stable'
}

interface Alert {
  id: number
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  time: string
  read: boolean
}

const OUTBREAKS: Outbreak[] = [
  {
    id: 1,
    city: 'São Paulo',
    state: 'SP',
    disease: 'Dengue',
    cases: 1284,
    newCases: 87,
    severity: 'critical',
    coordinates: [-23.5505, -46.6333],
    lastUpdate: '2h atrás',
    trend: 'up',
    lng: 0,
    lat: 0
  },
  {
    id: 2,
    city: 'Rio de Janeiro',
    state: 'RJ',
    disease: 'Chikungunya',
    cases: 432,
    newCases: 12,
    severity: 'high',
    coordinates: [-22.9068, -43.1729],
    lastUpdate: '4h atrás',
    trend: 'stable',
    lng: 0,
    lat: 0
  },
  {
    id: 3,
    city: 'Brasília',
    state: 'DF',
    disease: 'Dengue',
    cases: 215,
    newCases: -8,
    severity: 'medium',
    coordinates: [-15.7942, -47.8822],
    lastUpdate: '1h atrás',
    trend: 'down',
    lng: 0,
    lat: 0
  },
]

const ALERTS: Alert[] = [
  { id: 1, type: 'critical', title: 'Surto crítico detectado – SP', description: 'Dengue em São Paulo atingiu limiar crítico. +87 casos nas últimas 24h.', time: '2h atrás', read: false },
  { id: 2, type: 'warning',  title: 'Aumento em Recife', description: 'Alta de 36% em casos de Dengue. Monitorar nos próximos dias.', time: '3h atrás', read: false },
  { id: 3, type: 'info',     title: 'Queda em Brasília', description: 'Redução de 8 casos no DF. Possível efeito das ações preventivas.', time: '5h atrás', read: true },
  { id: 4, type: 'warning',  title: 'Novo foco em Manaus', description: 'Malária com tendência de alta. 21 novos casos registrados.', time: '6h atrás', read: true },
]

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
}

const DISEASES = ['Todas', 'Dengue', 'Chikungunya', 'Zika', 'Malária']

type Ripple = { x: number; y: number; r: number; alpha: number; speed: number; color: string }

function EpiMap({ outbreaks }: { outbreaks: Outbreak[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const ripplesRef = useRef<Ripple[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const addRipple = () => {
      const ob = outbreaks[Math.floor(Math.random() * outbreaks.length)]
      if (!ob) return

      ripplesRef.current.push({
        x: ob.lat,
        y: ob.lng,
        r: 0,
        alpha: 0.85,
        speed: 0.5 + Math.random() * 0.5,
        color: SEVERITY_COLOR[ob.severity],
      })
    }

    const iv = setInterval(addRipple, 450)

    const draw = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const w = canvas.width
      const h = canvas.height

      ctx.fillStyle = '#071a12'
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(13,158,117,0.06)'
      ctx.lineWidth = 0.5

      for (let x = 0; x < w; x += 28) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      for (let y = 0; y < h; y += 28) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      outbreaks.forEach(ob => {
        const px = ob.lat * w
        const py = ob.lng * h
        const color = SEVERITY_COLOR[ob.severity]
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 22)
        grd.addColorStop(0, color + '50')
        grd.addColorStop(1, 'transparent')

        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(px, py, 22, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(px, py, 6, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      })

      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rp = ripplesRef.current[i]
        ctx.beginPath()
        ctx.arc(rp.x * w, rp.y * h, rp.r, 0, Math.PI * 2)
        ctx.strokeStyle = rp.color + Math.round(rp.alpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = 1.5
        ctx.stroke()
        rp.r += rp.speed
        rp.alpha -= 0.013

        if (rp.alpha <= 0) {
          ripplesRef.current.splice(i, 1)
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      clearInterval(iv)
      cancelAnimationFrame(animRef.current)
    }
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


export default function HomeProfessional() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const onLogout = () => { logout(); navigate('/home-public') }
  const onGoProfile = () => navigate('/profile')
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers')
  const [diseaseFilter, setDiseaseFilter] = useState('Todas')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAlerts, setShowAlerts] = useState(false)
  const [alerts, setAlerts] = useState(ALERTS)
  const [activeTab, setActiveTab] = useState<'list' | 'chart'>('list')

  const unreadAlerts = alerts.filter(a => !a.read).length
  const [showLocationBanner, setShowLocationBanner] = useState(true)

  const filtered = OUTBREAKS.filter(ob => {
    const matchSev = severityFilter === 'all' || ob.severity === severityFilter
    const matchDis = diseaseFilter === 'Todas' || ob.disease === diseaseFilter
    const matchSearch =
      !searchQuery ||
      ob.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ob.disease.toLowerCase().includes(searchQuery.toLowerCase())

    return matchSev && matchDis && matchSearch
  })

  const totalCases = filtered.reduce((a, o) => a + o.cases, 0)
  const criticalCount = filtered.filter(o => o.severity === 'critical').length
  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const [exportLoading, setExportLoading] = useState(false)
  const { status: geoStatus, coords: userCoords } = useGeolocation()

  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })))

  const handleExportCSV = async () => {
    setExportLoading(true)
    await new Promise(r => setTimeout(r, 800)) // Simula tempo de geração
    // Gera CSV dos dados filtrados atualmente visíveis
    const header = 'id,cidade,estado,doenca,casos,novos_casos,severidade,tendencia,ultima_atualizacao'
    const rows = filtered.map(o =>
      [o.id, o.city, o.state, o.disease, o.cases, o.newCases, o.severity, o.trend, o.lastUpdate].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daery_surtos_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportLoading(false)
    // TODO: substituir por exportCSV() de services/api.ts quando backend disponível
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-dm">
      <nav className="bg-[#0B2D2A] px-6 py-3 flex items-center gap-4 sticky top-0 z-30 shadow-lg">
        <DaeryLogo />

        <div className="flex-1 max-w-md mx-4 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar doenças, municípios..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all" />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <button
              onClick={() => setShowAlerts(v => !v)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors relative"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="font-sora font-semibold text-slate-800 text-sm">Alertas</h3>
                  <button onClick={markAllRead} className="text-xs text-teal-600 hover:underline">
                    Marcar todos como lidos
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {alerts.map(al => (
                    <div key={al.id} className={`px-4 py-3 ${al.read ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${al.type === 'critical'
                              ? 'bg-red-500'
                              : al.type === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-blue-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{al.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{al.description}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{al.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onGoProfile}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
            title="Ir para o perfil"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Perfil
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold font-sora">
              {user?.initials ?? 'PF'}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-sm font-medium leading-tight">{user?.name ?? 'Pesquisador'}</p>
              <p className="text-teal-400 text-[10px] leading-tight">{user?.role === 'researcher' ? 'Pesquisador' : 'Profissional'}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="text-white/60 hover:text-white transition-colors"
            title="Sair"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>

      {(geoStatus === 'idle' || geoStatus === 'loading') && (
        <div className="bg-teal-50 border-b border-teal-200 px-6 py-2 flex items-center gap-2 text-teal-700 text-sm">
          <svg className="w-4 h-4 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span>Solicitando localização para personalizar o mapa...</span>
        </div>
      )}
      {geoStatus === 'granted' && userCoords && (
        <div className="bg-teal-50 border-b border-teal-200 px-6 py-2 flex items-center gap-2 text-teal-700 text-sm">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/>
          </svg>
          <span>Mapa centralizado na sua localização ({userCoords[0].toFixed(2)}, {userCoords[1].toFixed(2)}).</span>
        </div>
      )}
      {geoStatus === 'denied' && showLocationBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-amber-700 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <span>Permissão de localização negada. Exibindo mapa geral do Brasil.</span>
          </div>
          <button onClick={() => setShowLocationBanner(false)} className="text-amber-600 hover:text-amber-800 transition-colors" title="Fechar">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-6 overflow-x-auto">
        {[
          { label: 'Total de Casos', value: totalCases.toLocaleString('pt-BR') },
          { label: 'Doenças ativas', value: new Set(filtered.map(o => o.disease)).size },
          { label: 'Surtos Críticos', value: criticalCount },
          { label: 'Última Atualização', value: timeStr },
        ].map((stat, i) => (
          <div key={stat.label} className={`flex flex-col shrink-0 pr-6 ${i < 3 ? 'border-r border-slate-100' : ''}`}>
            <span className="text-xs text-slate-500">{stat.label}</span>
            <span className="text-xl font-sora font-bold text-slate-800">{stat.value}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            className="flex items-center gap-1.5 text-sm text-teal-600 border border-teal-200 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {exportLoading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            {exportLoading ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="3" />
            </svg>
            Série histórica
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <aside className="w-60 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
          <div className="p-4">
            <h2 className="font-sora font-semibold text-slate-700 text-sm flex items-center gap-1.5 mb-4">
              <svg className="w-4 h-4 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filtros
            </h2>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Modo de Visualização</p>
              <div className="flex gap-1.5">
                {(['markers', 'heatmap'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-all ${viewMode === mode
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}
                  >
                    {mode === 'markers' ? 'Marcadores' : 'Heatmap'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Doenças</p>
              <div className="space-y-1">
                {DISEASES.map(d => (
                  <button
                    key={d}
                    onClick={() => setDiseaseFilter(d)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-all ${diseaseFilter === d
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Severidade</p>
              <div className="space-y-1.5">
                {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all ${severityFilter === sev ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[sev] }} />
                    <span className="text-slate-600">{SEVERITY_LABEL[sev]}</span>
                    <span className="ml-auto text-slate-400">{OUTBREAKS.filter(o => o.severity === sev).length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Período</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-slate-400">Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full mt-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-teal-400 bg-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full mt-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-teal-400 bg-white" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Meus alertas</p>
              <div className="space-y-1.5">
                {alerts.slice(0, 3).map(al => (
                  <div
                    key={al.id}
                    className={`p-2 rounded-md text-xs border ${al.type === 'critical'
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : al.type === 'warning'
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : 'bg-blue-50 border-blue-100 text-blue-700'} ${al.read ? 'opacity-50' : ''}`}
                  >
                    <p className="font-medium truncate">{al.title}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{al.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
  <div className="relative bg-[#071a12] overflow-hidden min-h-[420px] w-full">
    <RealMap
      outbreaks={filtered}
      center={userCoords ?? undefined}
      zoom={userCoords ? 9 : 4}
    />

    <div className="absolute top-3 right-3 z-[9999]">
      Mapa de Surtos Epidemiológicos
    </div>

    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-3 text-xs">
      {Object.entries(SEVERITY_COLOR).map(([key, color]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-white/80">{SEVERITY_LABEL[key]}</span>
        </div>
      ))}
    </div>

    <div className="absolute bottom-3 left-3 text-white/70 text-xs bg-black/40 px-2.5 py-1 rounded-lg">
      {filtered.length} surtos encontrados &nbsp;·&nbsp;{' '}
      {filtered.reduce((a, o) => a + o.cases, 0).toLocaleString('pt-BR')} casos totais
    </div>
  </div>

  <div className="bg-white border-t border-slate-200 flex flex-col" style={{ flex: '0 0 220px' }}>
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
      <div className="flex gap-1">
        {(['list', 'chart'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeTab === tab
                ? 'bg-teal-600 text-white'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab === 'list' ? 'Listagem' : 'Gráfico'}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400">{filtered.length} registros</span>
    </div>

    {activeTab === 'list' ? (
      <div className="overflow-auto flex-1 p-4">
        {filtered.length === 0 ? (
      <div className="text-center text-slate-400 text-sm py-10">
        Nenhum surto encontrado com os filtros atuais
      </div>
    ) : (
       <div className="grid gap-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition"
          >
            {/* ESQUERDA */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-800">
                  {item.city} — {item.state}
                </span>

                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: SEVERITY_COLOR[item.severity] }}
                />
              </div>

              <p className="text-sm text-slate-500">
                {item.disease}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                {item.cases.toLocaleString('pt-BR')} casos
              </p>
            </div>

            {/* DIREITA */}
            <div className="text-right">
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: `${SEVERITY_COLOR[item.severity]}20`,
                  color: SEVERITY_COLOR[item.severity],
                }}
              >
                {SEVERITY_LABEL[item.severity]}
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
) : (
      <div className="flex-1 p-4 overflow-auto">
        <p className="text-xs text-slate-500 mb-3 font-medium">Casos por doença (dados filtrados)</p>
        <div className="space-y-3">
          {Array.from(new Set(filtered.map(o => o.disease))).map(disease => {
            const total = filtered.filter(o => o.disease === disease).reduce((a, o) => a + o.cases, 0)
            const maxCases = filtered.reduce((a, o) => Math.max(a, o.cases), 1)
            const pct = Math.round((total / Math.max(filtered.reduce((a,o) => a+o.cases, 0), 1)) * 100)
            return (
              <div key={disease}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700">{disease}</span>
                  <span className="text-xs text-slate-500">{total.toLocaleString('pt-BR')} casos ({pct}%)</span>
                </div>
                <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">Nenhum dado com os filtros atuais</p>
          )}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-3 font-medium">Tendência por surto (últimas 24h)</p>
          <div className="grid gap-2">
            {filtered.map(o => (
              <div key={o.id} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                <span>{o.city} — {o.disease}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${o.newCases > 0 ? 'text-red-500' : o.newCases < 0 ? 'text-teal-600' : 'text-slate-500'}`}>
                    {o.newCases > 0 ? '+' : ''}{o.newCases} casos
                  </span>
                  <span>{o.trend === 'up' ? '↑' : o.trend === 'down' ? '↓' : '→'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
        </main>
      </div>
    </div>
  )
}