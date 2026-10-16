import type { MapOutbreak } from './outbreaks'
import { SEVERITY_LABEL } from './outbreaks'

// CSV no padrão do Excel em português: separador ";" e BOM UTF-8 para acentos.
const SEPARATOR = ';'

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const text = typeof value === 'number' ? String(value).replace('.', ',') : value
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Contagem omitida pela API (1 a 4, para quem não é perfil profissional) sai como "<5",
// para não virar uma célula vazia que seria lida como zero.
const reportCell = (count: number | null) => (count === null ? '<5' : count)

export function outbreaksToCsv(outbreaks: MapOutbreak[], period: { startDate: string; endDate: string }): string {
  const header = [
    'municipio', 'uf', 'doenca', 'periodo_inicio', 'periodo_fim', 'casos_notificados', 'casos_estimados',
    'nivel_alerta', 'severidade', 'semana_epidemiologica', 'inicio_semana',
    'daery_suspeitos', 'daery_confirmados', 'daery_obitos', 'fontes', 'contem_dados_ficticios',
  ]
  const rows = outbreaks.map(o => [
    o.city, o.state, o.disease, period.startDate, period.endDate, o.cases, o.estimatedCases,
    o.alertLevel, SEVERITY_LABEL[o.severity], o.latestEpiWeek, o.latestWeekStart,
    reportCell(o.platformReports.suspected), reportCell(o.platformReports.confirmed), reportCell(o.platformReports.deaths),
    o.sources.join(' | '), o.includesDemoData ? 'sim' : 'nao',
  ])
  return '\uFEFF' + [header, ...rows].map(r => r.map(cell).join(SEPARATOR)).join('\r\n')
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
