import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


interface HealthIndicator {
  id: string
  label: string
  value: string
  detail: string
  action: 'edit' | 'add' | 'recalculate'
  highlight?: boolean
}

interface AccessLog {
  id: string
  description: string
  date: string
  tag: 'mapa' | 'dashboard' | 'perfil'
}


function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-teal-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}


function Section({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-7 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({
  icon,
  title,
  info,
  right,
  collapsible,
  open,
  onToggle,
}: {
  icon: React.ReactNode
  title: string
  info?: boolean
  right?: React.ReactNode
  collapsible?: boolean
  open?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      className={`flex items-center gap-2.5 mb-5 ${collapsible ? 'cursor-pointer' : ''}`}
      onClick={collapsible ? onToggle : undefined}
    >
      <span className="text-teal-500 w-5 h-5 flex-shrink-0">{icon}</span>
      <h2 className="font-sora font-semibold text-slate-800 text-base">{title}</h2>
      {info && (
        <button className="text-slate-400 hover:text-slate-600 ml-0.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      )}
      {right && <div className="ml-auto">{right}</div>}
      {collapsible && (
        <div className="ml-auto text-slate-400">
          <svg className={`w-4 h-4 transition-transform ${open ? '' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </div>
      )}
    </div>
  )
}

function MiniMap() {
  return (
    <div className="w-full h-full bg-slate-100 rounded-lg overflow-hidden relative">
      {/* SVG streets simulation */}
      <svg viewBox="0 0 320 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <rect width="320" height="180" fill="#e8ede8" />
        {/* Roads */}
        <line x1="0" y1="90" x2="320" y2="90" stroke="#fff" strokeWidth="8" />
        <line x1="160" y1="0" x2="160" y2="180" stroke="#fff" strokeWidth="8" />
        <line x1="0" y1="45" x2="320" y2="45" stroke="#fff" strokeWidth="4" />
        <line x1="0" y1="135" x2="320" y2="135" stroke="#fff" strokeWidth="4" />
        <line x1="80" y1="0" x2="80" y2="180" stroke="#fff" strokeWidth="4" />
        <line x1="240" y1="0" x2="240" y2="180" stroke="#fff" strokeWidth="4" />
        <line x1="0" y1="65" x2="320" y2="65" stroke="#e2e8e2" strokeWidth="2" />
        <line x1="0" y1="115" x2="320" y2="115" stroke="#e2e8e2" strokeWidth="2" />
        <line x1="120" y1="0" x2="120" y2="180" stroke="#e2e8e2" strokeWidth="2" />
        <line x1="200" y1="0" x2="200" y2="180" stroke="#e2e8e2" strokeWidth="2" />
        {/* Park */}
        <rect x="170" y="95" width="65" height="35" rx="4" fill="#c8dfc8" />
        {/* Buildings */}
        <rect x="85" y="50" width="30" height="38" rx="2" fill="#d4ddd4" />
        <rect x="20" y="97" width="55" height="33" rx="2" fill="#d4ddd4" />
        <rect x="245" y="50" width="40" height="38" rx="2" fill="#d4ddd4" />
        <rect x="170" y="20" width="25" height="20" rx="2" fill="#d4ddd4" />
        {/* Pin */}
        <circle cx="160" cy="90" r="14" fill="rgba(13,158,117,0.2)" />
        <circle cx="160" cy="90" r="8" fill="#0d9e75" />
        <circle cx="160" cy="90" r="4" fill="white" />
      </svg>
      <div className="absolute bottom-1.5 right-2 text-[10px] text-teal-700 font-medium">Leaflet</div>
    </div>
  )
}


export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const onBackToHomeProfessional = () => navigate('/home-professional')
  const [nome, setNome] = useState(user?.name ?? '')
  const [dataNasc, setDataNasc] = useState('')
  const [genero, setGenero] = useState('Masculino')
  const [cep, setCep] = useState('')
  const [consentLoc, setConsentLoc] = useState(true)

  const [healthOpen, setHealthOpen] = useState(true)

  const [notifRegiao, setNotifRegiao] = useState(true)
  const [notifCondicao, setNotifCondicao] = useState(true)
  const [mapSurtos, setMapSurtos] = useState(true)
  const [mapCalor, setMapCalor] = useState(false)

  const [shareData, setShareData] = useState(true)

  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const age = dataNasc
    ? Math.floor((Date.now() - new Date(dataNasc).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const ageGroup = age !== null
    ? age < 18 ? '0–17 anos' : age < 60 ? '18–59 anos' : '60+ anos'
    : '—'

  const indicators: HealthIndicator[] = [
  { id: 'age',        label: 'Idade',                   value: age ? `${age} anos` : '—', detail: 'Calculada automaticamente', action: 'edit' },
  { id: 'conditions', label: 'Condições Pré-Existentes', value: '—',  detail: '', action: 'edit' },
  { id: 'vaccines',   label: 'Vacinações',               value: '—',  detail: '', action: 'add' },
  { id: 'imc',        label: 'IMC',                      value: '—',  detail: '', action: 'recalculate' },
  { id: 'risk',       label: 'Fatores de Risco',         value: '—',  detail: '', action: 'edit' },
  { id: 'allergies',  label: 'Alergias / Medicamentos',  value: '—',  detail: '', action: 'edit' },
]

  const accessLogs: AccessLog[] = []

  const tagColors: Record<string, string> = {
    mapa: 'bg-slate-100 text-slate-600',
    dashboard: 'bg-slate-100 text-slate-600',
    perfil: 'bg-slate-100 text-slate-600',
  }

  const actionIcon = (action: string) => {
    if (action === 'edit') return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    )
    if (action === 'add') return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4" />
      </svg>
    )
  }

  const actionLabel = (action: string) => {
    if (action === 'add') return 'Adicionar'
    if (action === 'recalculate') return 'Recalcular'
    return 'Editar'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-0 flex items-center h-14 sticky top-0 z-30">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-sora font-semibold text-slate-800 text-base">Daery</span>
        </div>

        <div className="flex items-center gap-1">
          {[
  {
    label: 'Perfil de Saúde',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    active: true,
  },
  {
    label: 'Mapa de Surtos',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
    active: false,
    onClick: onBackToHomeProfessional,
  },
  {
    label: 'Dashboard',
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    active: false,
  },
].map(item => (
  <button
    key={item.label}
    type="button"
    onClick={item.onClick}
    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      item.active
        ? 'bg-slate-100 text-slate-800 border border-slate-200'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`}
  >
    {item.icon}
    {item.label}
  </button>
))}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold font-sora">{user?.initials ?? '?'}</span>
            </div>
            <span className="text-sm text-slate-700 font-medium">{(user?.name ?? nome) || 'Meu perfil'}</span>
            <span className="text-xs text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              {user?.role === 'researcher' ? 'Pesquisador' : 'Público'}
            </span>
          </div>
          <button
            onClick={() => { logout(); navigate('/home-public') }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
            title="Sair"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </nav>

      {/* Page content */}
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-sora text-2xl font-bold text-slate-800 mb-1">Perfil de Saúde</h1>
          <p className="text-sm text-slate-500">Gerencie suas informações de saúde para receber alertas personalizados.</p>
        </div>

        {/* Quick nav tabs */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { label: 'FAQ & Suporte', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
          ].map(tab => (
            <button
              key={tab.label}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-5">

          {/* ── Informações Pessoais ── */}
          <Section>
            <SectionTitle
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              title="Informações Pessoais"
            />

            <div className="flex gap-5 mb-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-xl bg-teal-600 border border-teal-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold font-sora">{user?.initials ?? '?'}</span>
              </div>

              {/* Nome + Email */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Nome / Apelido</label>
                  <input
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">E-mail</label>
                  <input
                    defaultValue={user?.email ?? ''}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400 focus:outline-none cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Data / Gênero / Idade */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Data de Nascimento</label>
                <input
                  type="date"
                  value={dataNasc}
                  onChange={e => setDataNasc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Gênero</label>
                <select
                  value={genero}
                  onChange={e => setGenero(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 bg-white"
                >
                  <option>Masculino</option>
                  <option>Feminino</option>
                  <option>Não-binário</option>
                  <option>Prefiro não informar</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Idade / Grupo Etário</label>
                <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 flex items-center gap-2">
                  <span className="font-medium text-slate-700">{age ?? '—'} anos</span>
                  <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{ageGroup}</span>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <label className="text-xs font-medium text-slate-700">Localização (CEP)</label>
                <button className="text-slate-400">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    value={cep}
                    onChange={e => setCep(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 mb-3"
                  />
                  <div className="flex items-center gap-3 bg-teal-50 border border-teal-200/60 rounded-lg px-3 py-2.5">
                    <svg className="w-4 h-4 text-teal-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700">Consentimento de localização</p>
                      <p className="text-xs text-slate-500">Permitir uso nos mapas de surtos</p>
                    </div>
                    <Toggle checked={consentLoc} onChange={setConsentLoc} />
                  </div>
                </div>
                <div className="w-[320px] h-[130px] rounded-xl overflow-hidden border border-slate-200">
                  <MiniMap />
                </div>
              </div>
            </div>
          </Section>

          {/* ── Indicadores de Saúde ── */}
          <Section>
            <SectionTitle
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
              title="Indicadores de Saúde"
              info
              collapsible
              open={healthOpen}
              onToggle={() => setHealthOpen(o => !o)}
            />

            {healthOpen && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Indicador</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor Atual</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Detalhes</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicators.map((ind, i) => (
                      <tr key={ind.id} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? '' : ''}`}>
                        <td className="px-4 py-3 font-medium text-slate-700">{ind.label}</td>
                        <td className={`px-4 py-3 ${ind.highlight ? 'text-teal-600 font-medium' : 'text-slate-600'}`}>{ind.value}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{ind.detail}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => showToast(`${actionLabel(ind.action)}: ${ind.label}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
                          >
                            {actionIcon(ind.action)}
                            {actionLabel(ind.action)}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ── Preferências ── */}
          <Section>
            <SectionTitle
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 1 0 4.93 19.07"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
              title="Preferências"
            />

            {/* Notifications */}
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3">
                <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notificações</span>
              </div>
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Surtos na minha região</p>
                    <p className="text-xs text-slate-400 mt-0.5">Receba alertas sobre surtos detectados próximos à sua localização</p>
                  </div>
                  <Toggle checked={notifRegiao} onChange={setNotifRegiao} />
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Alertas por condição</p>
                    <p className="text-xs text-slate-400 mt-0.5">Notificações sobre doenças relacionadas às suas condições de saúde</p>
                  </div>
                  <Toggle checked={notifCondicao} onChange={setNotifCondicao} />
                </div>
              </div>
            </div>

            {/* Map visualization */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Visualização de Mapas</span>
              </div>
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Camada de surtos ativos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Mostrar surtos em andamento no mapa</p>
                  </div>
                  <Toggle checked={mapSurtos} onChange={setMapSurtos} />
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Mapa de calor por densidade</p>
                    <p className="text-xs text-slate-400 mt-0.5">Visualização de intensidade por região</p>
                  </div>
                  <Toggle checked={mapCalor} onChange={setMapCalor} />
                </div>
              </div>
            </div>
          </Section>

          {/* ── Privacidade e Dados ── */}
          <Section>
            <SectionTitle
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              title="Privacidade e Dados (LGPD)"
              right={
                <span className="flex items-center gap-1.5 text-xs text-teal-600 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Dados anônimos compartilhados
                </span>
              }
            />

            {/* LGPD notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-700 mb-1.5">Aviso de Privacidade (LGPD)</p>
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), seus dados pessoais são armazenados de forma segura e utilizados exclusivamente para personalizar sua experiência e, caso autorizado, contribuir com estatísticas epidemiológicas{' '}
              <strong>de forma anônima e agregada</strong>. Você tem o direito de acessar, corrigir, exportar e excluir seus dados a qualquer momento.
            </div>

            {/* Share toggle */}
            <div className="rounded-xl border border-slate-200 mb-4">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-700">Compartilhar dados anônimos</p>
                  <p className="text-xs text-slate-400 mt-0.5">Contribua para estatísticas públicas de saúde. Seus dados são anonimizados e nunca identificam você individualmente.</p>
                </div>
                <Toggle checked={shareData} onChange={setShareData} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => showToast('Exportação iniciada...')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exportar meus dados
              </button>
              <button
                onClick={() => showToast('Ação irreversível — confirmação necessária')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Excluir meus dados
              </button>
            </div>
          </Section>

          {/* ── Histórico de Acesso ── */}
          <Section>
            <SectionTitle
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              title="Histórico de Acesso"
            />
            <div className="space-y-1">
              {accessLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {log.tag === 'mapa' && (
                      <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
                    )}
                    {log.tag === 'dashboard' && (
                      <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    )}
                    {log.tag === 'perfil' && (
                      <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{log.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{log.date}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${tagColors[log.tag]}`}>{log.tag}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Save button */}
          <div className="flex justify-end pb-4">
            <button
              onClick={() => showToast('Perfil salvo com sucesso!')}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold font-sora px-8 py-2.5 rounded-xl text-sm transition-colors"
            >
              Salvar alterações
            </button>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#0B2D2A] text-white px-5 py-3.5 rounded-xl text-sm shadow-xl z-50 animate-fade-in">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
