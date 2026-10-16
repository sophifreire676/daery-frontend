import React, { useMemo, useState } from 'react'
import RealMap, { MapViewMode } from '../components/RealMap'
import AlertList from '../components/AlertList'
import DataStatus from '../components/DataStatus'
import { useAlerts, useCaseSummary } from '../hooks/useApiData'
import {
  SEVERITY_COLOR,
  SEVERITY_DESCRIPTION,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  SeverityKey,
  countBySeverity,
  filterOutbreaks,
  formatIsoDate,
  latestWeek,
  sortAlertsByRelevance,
  toOutbreak,
} from '../utils/outbreaks'
import { periodError, toSummaryPeriod } from '../utils/period'
import { useNavigate } from 'react-router-dom'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAuth } from '../context/AuthContext'
import { verificationLabel } from '../utils/roles'

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
  const { user, isAuthenticated, logout } = useAuth()
  const onLogin = () => navigate('/login')
  const onRegister = () => navigate('/register')
  // Reportar exige perfil profissional aprovado: o visitante entra e volta para a Home 2
  // com o formulário de notificação já aberto (se o perfil puder reportar).
  const onReportCase = () => navigate('/login', { state: { from: '/home-professional', openReport: true } })
  const onLogout = () => logout()
  const pendingNotice = user ? verificationLabel(user.verificationStatus, user.requestedRole) : null
  const [activeFilter, setActiveFilter] = useState<SeverityKey | 'all'>('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [viewMode, setViewMode]         = useState<MapViewMode>('markers')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')

  const { status: geoStatus, coords: userCoords } = useGeolocation()

  // Período e doença vão para a API; severidade e busca filtram localmente.
  const dateError = periodError({ startDate, endDate })
  const summary = useCaseSummary(toSummaryPeriod({ startDate, endDate }), !dateError)
  const alertsState = useAlerts()

  const outbreaks = useMemo(() => (summary.data?.items ?? []).map(toOutbreak), [summary.data])
  const filtered = useMemo(
    () => filterOutbreaks(outbreaks, { severity: activeFilter, search: searchQuery }),
    [outbreaks, activeFilter, searchQuery]
  )
  const severityCounts = countBySeverity(outbreaks)
  const alerts = useMemo(
    () => sortAlertsByRelevance(alertsState.data ?? [], userCoords ?? null),
    [alertsState.data, userCoords]
  )

  const totalCases    = outbreaks.reduce((acc, o) => acc + o.cases, 0)
  const criticalCount = severityCounts.critical
  const diseaseCount  = new Set(outbreaks.filter(o => o.cases > 0).map(o => o.disease)).size
  const dataUntil     = latestWeek(outbreaks)
  const hasDemoData   = outbreaks.some(o => o.includesDemoData)
  const offMap        = filtered.filter(o => o.coordinates === null).length

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
              {criticalCount} situação{criticalCount > 1 ? 'ões' : ''} crítica{criticalCount > 1 ? 's' : ''}
            </div>
          )}

{isAuthenticated && user ? (
            <>
              {user.isProfessional && (
                <button
                  onClick={() => navigate('/home-professional')}
                  className="hidden sm:inline-flex border border-white/20 hover:border-teal-400/50 text-white hover:text-teal-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Área profissional
                </button>
              )}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                title="Ir para o perfil"
              >
                <span className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-[11px] font-bold font-sora" aria-hidden="true">
                  {user.initials}
                </span>
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={onLogout}
                className="text-white/70 hover:text-white text-sm px-2 py-2 transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
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
              onClick={onReportCase}
              title="Para profissionais de saúde e instituições"
              className="border border-white/20 hover:border-teal-400/50 text-white hover:text-teal-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Reportar caso
            </button>
            </>
          )}
        </div>
      </nav>

      {pendingNotice && (
        <div role="status" className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-sm text-amber-800">
          <strong>{pendingNotice}.</strong>{' '}
          {user?.verificationStatus === 'PENDING'
            ? 'Enquanto a equipe do Daery confere os dados, você usa o Daery como cidadão.'
            : 'Sua conta continua ativa como cidadão. Em caso de dúvida, fale com a equipe do Daery.'}
        </div>
      )}

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
          { label: 'Casos no período',   value: summary.loading ? '…' : totalCases.toLocaleString('pt-BR') },
          { label: 'Doenças com casos',  value: summary.loading ? '…' : diseaseCount },
          { label: 'Situações críticas', value: summary.loading ? '…' : criticalCount },
          { label: 'Dados até',          value: summary.loading ? '…' : dataUntil ? `semana de ${formatIsoDate(dataUntil)}` : '—' },
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
                {(['markers', 'intensity'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    title={mode === 'intensity' ? 'Tamanho do círculo proporcional ao número de casos' : 'Círculos do mesmo tamanho, cor pela severidade'}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-all ${
                      viewMode === mode
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-teal-300'
                    }`}
                  >
                    {mode === 'markers' ? 'Marcadores' : 'Intensidade'}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity filter */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Severidade</p>
              <div className="space-y-1.5">
                {SEVERITY_ORDER.filter(sev => sev !== 'unknown' || severityCounts.unknown > 0).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setActiveFilter(activeFilter === sev ? 'all' : sev)}
                    aria-pressed={activeFilter === sev}
                    title={SEVERITY_DESCRIPTION[sev]}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all ${
                      activeFilter === sev ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[sev] }} />
                    <span className="text-slate-600">{SEVERITY_LABEL[sev]}</span>
                    <span className="ml-auto text-slate-400">
                      {severityCounts[sev]}
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
                  <label htmlFor="pub-start" className="text-xs text-slate-400">Data inicial</label>
                  <input
                    id="pub-start"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full mt-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label htmlFor="pub-end" className="text-xs text-slate-400">Data final</label>
                  <input
                    id="pub-end"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full mt-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-teal-400"
                  />
                </div>
                {dateError ? (
                  <p role="alert" className="text-xs text-red-600">{dateError}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">Sem datas, mostra as últimas 8 semanas.</p>
                )}
              </div>
            </div>
          </div>

          {/* Alertas preventivos (RF-004): públicos, os mais próximos do usuário primeiro */}
          <div className="p-4 border-t border-slate-100 overflow-y-auto">
            <h2 className="font-sora font-semibold text-slate-700 text-sm mb-2">Alertas ativos</h2>
            {alerts.length > 0 ? (
              <AlertList alerts={alerts} maxItems={isAuthenticated ? undefined : 3} />
            ) : (
              <DataStatus
                loading={alertsState.loading}
                error={alertsState.error}
                isEmpty={!alertsState.loading && !alertsState.error}
                onRetry={alertsState.reload}
                emptyText="Nenhum alerta ativo no momento."
              />
            )}
            {!isAuthenticated && alerts.length > 3 && (
              <p className="text-[11px] text-slate-500 mt-2">Entre para ver todos os {alerts.length} alertas.</p>
            )}
          </div>

          {/* CTA for unauthenticated */}
          {!isAuthenticated && (
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
                <p className="text-xs text-slate-500 mt-0.5">Filtros avançados e alertas para profissionais; exportação de dados para pesquisadores</p>
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
          )}
        </aside>

        {/* ── Map + List ── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Map */}
          <div className="relative flex-1 bg-[#071a12] overflow-hidden h-[420px] w-full">
            <RealMap
              outbreaks={filtered}
              mode={viewMode}
              center={userCoords ?? undefined}
              zoom={userCoords ? 8 : 4}
            />

            <DataStatus
              variant="overlay"
              loading={summary.loading}
              error={dateError ? null : summary.error}
              isEmpty={!dateError && !summary.loading && !summary.error && filtered.length === 0}
              onRetry={summary.reload}
              emptyText={outbreaks.length === 0 ? 'Ainda não há dados para este período.' : 'Nenhum resultado para os filtros escolhidos.'}
            />

            {/* Map label */}
            <div className="absolute top-3 left-14 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-sora font-semibold z-[500]">
              Mapa de Surtos Epidemiológicos
            </div>

            {/* Contagem e aviso de dados fictícios */}
            <div className="absolute bottom-3 left-3 text-white text-xs bg-black/60 px-2.5 py-1 rounded-lg z-[500]" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'} · {filtered.reduce((a, o) => a + o.cases, 0).toLocaleString('pt-BR')} casos
              {offMap > 0 && ` · ${offMap} sem localização no mapa`}
            </div>
            {hasDemoData && (
              <div className="absolute top-3 right-3 bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded-lg z-[500]">
                Inclui dados fictícios de demonstração
              </div>
            )}
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
                  <p className="text-slate-400 text-[11px]">casos · semana de {formatIsoDate(ob.latestWeekStart)}</p>
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
