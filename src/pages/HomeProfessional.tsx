import React, { useEffect, useMemo, useRef, useState } from 'react'
import RealMap, { MapViewMode } from '../components/RealMap'
import AlertList from '../components/AlertList'
import CaseReportDialog from '../components/caseReport/CaseReportDialog'
import DataStatus from '../components/DataStatus'
import { useAlerts, useCaseSummary, useDiseases } from '../hooks/useApiData'
import { downloadCsv, outbreaksToCsv } from '../utils/csv'
import {
  SEVERITY_COLOR,
  SEVERITY_DESCRIPTION,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  SeverityKey,
  countBySeverity,
  filterOutbreaks,
  formatEpiWeek,
  formatIsoDate,
  latestWeek,
  formatPlatformReports,
  hasPlatformReports,
  sortAlertsByRelevance,
  toOutbreak,
} from '../utils/outbreaks'
import { periodError, toSummaryPeriod } from '../utils/period'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { canExportData, canReportCases, roleLabel } from '../utils/roles'

// Alertas marcados como lidos ficam na sessão do navegador.
const READ_ALERTS_KEY = 'daery_read_alerts'

function loadReadAlerts(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(READ_ALERTS_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
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
  const [viewMode, setViewMode] = useState<MapViewMode>('markers')
  const [diseaseId, setDiseaseId] = useState('')
  const [severityFilter, setSeverityFilter] = useState<SeverityKey | 'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAlerts, setShowAlerts] = useState(false)
  const [readAlerts, setReadAlerts] = useState<Set<string>>(loadReadAlerts)
  const [activeTab, setActiveTab] = useState<'list' | 'chart'>('list')
  const [showLocationBanner, setShowLocationBanner] = useState(true)
  const location = useLocation()
  const canReport = canReportCases(user?.role)
  // RF-005: exportação só para pesquisador e admin (separado do acesso à Home 2).
  const canExport = canExportData(user?.role)
  const [showReport, setShowReport] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const reportButtonRef = useRef<HTMLButtonElement>(null)

  // Aberto a partir de outra tela (ex.: "Reportar caso" na Home pública).
  useEffect(() => {
    if (canReport && (location.state as { openReport?: boolean } | null)?.openReport) {
      setShowReport(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [canReport, location, navigate])

  const closeReport = () => {
    setShowReport(false)
    reportButtonRef.current?.focus()
  }

  const handleCaseCreated = () => {
    closeReport()
    summary.reload()
    setNotice('Caso registrado. Ele já aparece em "casos reportados no Daery" do município.')
    setTimeout(() => setNotice(null), 6000)
  }
  const { status: geoStatus, coords: userCoords } = useGeolocation()

  // Período e doença vão para a API; severidade e busca filtram localmente.
  const dateError = periodError({ startDate, endDate })
  const summaryFilters = { ...toSummaryPeriod({ startDate, endDate }), ...(diseaseId ? { diseaseId } : {}) }
  const summary = useCaseSummary(summaryFilters, !dateError)
  const diseases = useDiseases()
  const alertsState = useAlerts(diseaseId ? { diseaseId } : {})

  const outbreaks = useMemo(() => (summary.data?.items ?? []).map(toOutbreak), [summary.data])
  const filtered = useMemo(
    () => filterOutbreaks(outbreaks, { severity: severityFilter, search: searchQuery }),
    [outbreaks, severityFilter, searchQuery]
  )
  const severityCounts = countBySeverity(outbreaks)
  const alerts = useMemo(
    () => sortAlertsByRelevance(alertsState.data ?? [], userCoords ?? null),
    [alertsState.data, userCoords]
  )
  const unreadAlerts = alerts.filter(a => !readAlerts.has(a.id)).length

  const totalCases = filtered.reduce((a, o) => a + o.cases, 0)
  const criticalCount = filtered.filter(o => o.severity === 'critical').length
  const dataUntil = latestWeek(outbreaks)
  const hasDemoData = outbreaks.some(o => o.includesDemoData)
  const daeryReports = filtered.filter(o => hasPlatformReports(o.platformReports))

  const markAllRead = () => {
    const next = new Set([...readAlerts, ...alerts.map(a => a.id)])
    setReadAlerts(next)
    try {
      sessionStorage.setItem(READ_ALERTS_KEY, JSON.stringify([...next]))
    } catch {
      /* armazenamento indisponível: vale só nesta tela */
    }
  }

  // RF-005 (decisão D7): CSV gerado no navegador a partir dos dados exibidos (mesmos filtros).
  const handleExportCSV = () => {
    if (!canExport || !summary.data || filtered.length === 0) return
    downloadCsv(outbreaksToCsv(filtered, summary.data.period), `daery_${summary.data.period.startDate}_a_${summary.data.period.endDate}.csv`)
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
              aria-label={`Alertas${unreadAlerts ? ` (${unreadAlerts} não lidos)` : ''}`}
              aria-expanded={showAlerts}
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
                <div className="max-h-96 overflow-y-auto p-3">
                  {alerts.length > 0 ? (
                    <AlertList alerts={alerts} readIds={readAlerts} />
                  ) : (
                    <DataStatus
                      loading={alertsState.loading}
                      error={alertsState.error}
                      isEmpty={!alertsState.loading && !alertsState.error}
                      onRetry={alertsState.reload}
                      emptyText="Nenhum alerta ativo no momento."
                    />
                  )}
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
              {user?.initials ?? '?'}
            </div>
            <div className="hidden sm:block">
              <p className="text-white text-sm font-medium leading-tight">{user?.name ?? ''}</p>
              <p className="text-teal-400 text-[10px] leading-tight">{user ? roleLabel(user.role) : ''}</p>
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
          { label: 'Casos (filtros atuais)', value: summary.loading ? '…' : totalCases.toLocaleString('pt-BR') },
          { label: 'Doenças com casos', value: summary.loading ? '…' : new Set(filtered.filter(o => o.cases > 0).map(o => o.disease)).size },
          { label: 'Situações críticas', value: summary.loading ? '…' : criticalCount },
          { label: 'Dados até', value: summary.loading ? '…' : dataUntil ? `semana de ${formatIsoDate(dataUntil)}` : '—' },
        ].map((stat, i) => (
          <div key={stat.label} className={`flex flex-col shrink-0 pr-6 ${i < 3 ? 'border-r border-slate-100' : ''}`}>
            <span className="text-xs text-slate-500">{stat.label}</span>
            <span className="text-xl font-sora font-bold text-slate-800">{stat.value}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {canReport && (
            <button
              ref={reportButtonRef}
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-sm text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Reportar caso
            </button>
          )}
          {canExport && (
            <button
              onClick={handleExportCSV}
              disabled={summary.loading || filtered.length === 0}
              title="Baixa os registros exibidos, com os filtros atuais"
              className="flex items-center gap-1.5 text-sm text-teal-600 border border-teal-200 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar CSV
            </button>
          )}
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
              <p className="text-xs text-slate-500 mb-2 font-medium">Modo de visualização</p>
              <div className="flex gap-1.5">
                {(['markers', 'intensity'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    title={mode === 'intensity' ? 'Tamanho do círculo proporcional ao número de casos' : 'Círculos do mesmo tamanho, cor pela severidade'}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-all ${viewMode === mode
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}
                  >
                    {mode === 'markers' ? 'Marcadores' : 'Intensidade'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Doenças</p>
              <div className="space-y-1">
                {[{ id: '', name: 'Todas', monitoredByInfoDengue: false }, ...(diseases.data ?? [])].map(d => (
                  <button
                    key={d.id || 'todas'}
                    onClick={() => setDiseaseId(d.id)}
                    aria-pressed={diseaseId === d.id}
                    className={`w-full flex items-center text-left text-xs px-2.5 py-1.5 rounded-md transition-all ${diseaseId === d.id
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {d.name}
                    {d.id && !d.monitoredByInfoDengue && (
                      <span className="ml-auto text-[10px] text-slate-400" title="O InfoDengue não cobre esta doença">sem InfoDengue</span>
                    )}
                  </button>
                ))}
                {diseases.error && <p className="text-[11px] text-red-600 px-2.5">Não foi possível carregar as doenças.</p>}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Severidade</p>
              <div className="space-y-1.5">
                {SEVERITY_ORDER.filter(sev => sev !== 'unknown' || severityCounts.unknown > 0).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
                    aria-pressed={severityFilter === sev}
                    title={SEVERITY_DESCRIPTION[sev]}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all ${severityFilter === sev ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[sev] }} />
                    <span className="text-slate-600">{SEVERITY_LABEL[sev]}</span>
                    <span className="ml-auto text-slate-400">{severityCounts[sev]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Período</p>
              <div className="space-y-2">
                <div>
                  <label htmlFor="pro-start" className="text-xs text-slate-400">Data inicial</label>
                  <input
                    id="pro-start"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full mt-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-teal-400 bg-white" />
                </div>
                <div>
                  <label htmlFor="pro-end" className="text-xs text-slate-400">Data final</label>
                  <input
                    id="pro-end"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full mt-1 text-xs border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600 focus:outline-none focus:border-teal-400 bg-white" />
                </div>
                {dateError ? (
                  <p role="alert" className="text-xs text-red-600">{dateError}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    {summary.data ? `Exibindo ${formatIsoDate(summary.data.period.startDate)} a ${formatIsoDate(summary.data.period.endDate)}` : 'Sem datas, mostra as últimas 8 semanas.'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2 font-medium">Alertas mais relevantes</p>
              {alerts.length > 0 ? (
                <AlertList alerts={alerts} readIds={readAlerts} maxItems={3} compact />
              ) : (
                <p className="text-xs text-slate-400">
                  {alertsState.loading ? 'Carregando…' : alertsState.error ? 'Não foi possível carregar os alertas.' : 'Nenhum alerta ativo.'}
                </p>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
  <div className="relative bg-[#071a12] overflow-hidden min-h-[420px] w-full">
    <RealMap
      outbreaks={filtered}
      mode={viewMode}
      center={userCoords ?? undefined}
      zoom={userCoords ? 9 : 4}
    />

    <DataStatus
      variant="overlay"
      loading={summary.loading}
      error={dateError ? null : summary.error}
      isEmpty={!dateError && !summary.loading && !summary.error && filtered.length === 0}
      onRetry={summary.reload}
      emptyText={outbreaks.length === 0 ? 'Ainda não há dados para este período.' : 'Nenhum resultado para os filtros escolhidos.'}
    />

    <div className="absolute top-3 left-14 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-sora font-semibold z-[500]">
      Mapa epidemiológico
    </div>

    {hasDemoData && (
      <div className="absolute top-3 right-3 bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded-lg z-[500]">
        Inclui dados fictícios de demonstração
      </div>
    )}

    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex flex-wrap items-center gap-3 text-xs z-[500]">
      {SEVERITY_ORDER.map(key => (
        <div key={key} className="flex items-center gap-1.5" title={SEVERITY_DESCRIPTION[key]}>
          <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR[key] }} />
          <span className="text-white/80">{SEVERITY_LABEL[key]}</span>
        </div>
      ))}
    </div>

    <div className="absolute bottom-3 left-3 text-white text-xs bg-black/60 px-2.5 py-1 rounded-lg z-[500]" aria-live="polite">
      {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'} · {totalCases.toLocaleString('pt-BR')} casos
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
      <DataStatus
        loading={summary.loading}
        error={dateError ? null : summary.error}
        isEmpty
        onRetry={summary.reload}
        emptyText="Nenhum registro com os filtros atuais."
      />
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
                {item.cases.toLocaleString('pt-BR')} casos notificados
                {item.estimatedCases !== null && ` · ${item.estimatedCases.toLocaleString('pt-BR')} estimados`}
                {item.latestWeekStart && ` · ${formatEpiWeek(item.latestEpiWeek) || 'semana de ' + formatIsoDate(item.latestWeekStart)}`}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasPlatformReports(item.platformReports) && `Daery: ${formatPlatformReports(item.platformReports)} · `}
                Fonte: {item.sources.join(', ') || 'notificações do Daery'}
                {item.coordinates === null && ' · sem localização no mapa'}
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
        <p className="text-xs text-slate-500 mb-3 font-medium">Casos notificados por doença (filtros atuais)</p>
        <div className="space-y-3">
          {Array.from(new Set(filtered.map(o => o.disease))).map(disease => {
            const total = filtered.filter(o => o.disease === disease).reduce((a, o) => a + o.cases, 0)
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
        {daeryReports.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3 font-medium">Casos reportados no Daery por profissionais e instituições</p>
            <div className="grid gap-2">
              {daeryReports.map(o => (
                <div key={o.id} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  <span>{o.city} — {o.disease}</span>
                  <span>{formatPlatformReports(o.platformReports)}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Contados à parte das fontes externas, porque o mesmo paciente pode estar nas duas.</p>
          </div>
        )}
      </div>
    )}
  </div>
        </main>
      </div>
      {showReport && (
        <CaseReportDialog diseases={diseases.data ?? []} onClose={closeReport} onCreated={handleCaseCreated} />
      )}

      {notice && (
        <div role="status" className="fixed bottom-6 right-6 bg-[#0B2D2A] text-white px-5 py-3.5 rounded-xl text-sm shadow-xl z-[2100]">
          ✓ {notice}
        </div>
      )}
    </div>
  )
}