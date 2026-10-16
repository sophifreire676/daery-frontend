// Converte o resumo da API (GET /epidemiological-data/summary) no formato usado pelo mapa e pelas listas.
import type { Alert, PlatformReports, Severity, SummaryItem } from '../types/api'

export type SeverityKey = 'critical' | 'high' | 'medium' | 'low' | 'unknown'

export interface MapOutbreak {
  id: string
  regionId: string
  diseaseId: string
  city: string
  state: string
  disease: string
  /** Casos notificados no período (fontes externas, ex.: InfoDengue). */
  cases: number
  estimatedCases: number | null
  severity: SeverityKey
  alertLevel: number | null
  /** null quando o município não tem coordenadas: aparece na lista, mas não no mapa. */
  coordinates: [number, number] | null
  latestWeekStart: string | null
  latestEpiWeek: number | null
  platformReports: SummaryItem['platformReports']
  sources: string[]
  includesDemoData: boolean
}

const SEVERITY_KEY: Record<Severity, SeverityKey> = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

export const SEVERITY_ORDER: SeverityKey[] = ['critical', 'high', 'medium', 'low', 'unknown']

export const SEVERITY_COLOR: Record<SeverityKey, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  unknown: '#94a3b8',
}

export const SEVERITY_LABEL: Record<SeverityKey, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
  unknown: 'Sem classificação',
}

/** Significado de cada nível, conforme o InfoDengue (regra RNE012). */
export const SEVERITY_DESCRIPTION: Record<SeverityKey, string> = {
  critical: 'Incidência acima de 90% do histórico do município',
  high: 'Transmissão aumentada e sustentada',
  medium: 'Condições favoráveis ao mosquito e à transmissão',
  low: 'Condições desfavoráveis à transmissão',
  unknown: 'Fonte sem nível de alerta',
}

export function toSeverityKey(severity: Severity | null): SeverityKey {
  return severity ? SEVERITY_KEY[severity] : 'unknown'
}

export function toOutbreak(item: SummaryItem): MapOutbreak {
  const hasCoords = item.latitude !== null && item.longitude !== null
  return {
    id: `${item.regionId}:${item.diseaseId}`,
    regionId: item.regionId,
    diseaseId: item.diseaseId,
    city: item.regionName,
    state: item.uf,
    disease: item.diseaseName,
    cases: item.totalCases,
    estimatedCases: item.estimatedCases,
    severity: toSeverityKey(item.severity),
    alertLevel: item.latestAlertLevel,
    coordinates: hasCoords ? [item.latitude as number, item.longitude as number] : null,
    latestWeekStart: item.latestWeekStart,
    latestEpiWeek: item.latestEpiWeek,
    platformReports: item.platformReports,
    sources: item.sources,
    includesDemoData: item.includesDemoData,
  }
}

// --- Casos reportados no Daery (podem vir com contagens pequenas omitidas) ---------

/** Há algum caso reportado? Contagem omitida (null) significa de 1 a 4, ou seja, há casos. */
export function hasPlatformReports(reports: PlatformReports): boolean {
  return [reports.suspected, reports.confirmed, reports.deaths].some(count => count === null || count > 0)
}

/** null → "menos de 5" (a API omite contagens de 1 a 4 para o público). */
export function formatReportCount(count: number | null): string {
  return count === null ? 'menos de 5' : count.toLocaleString('pt-BR')
}

export function formatPlatformReports(reports: PlatformReports): string {
  return [
    `${formatReportCount(reports.suspected)} suspeitos`,
    `${formatReportCount(reports.confirmed)} confirmados`,
    `${formatReportCount(reports.deaths)} óbitos`,
  ].join(' · ')
}

// --- Agrupamento por município para o mapa ---------------------------------------

/**
 * Um marcador por município. O resumo da API traz uma linha por município × doença, todas
 * com a mesma coordenada; desenhadas separadamente, ficam empilhadas e só a de cima é clicável.
 */
export interface RegionGroup {
  regionId: string
  city: string
  state: string
  coordinates: [number, number]
  /** Pior severidade entre as doenças do município (define a cor do marcador). */
  severity: SeverityKey
  /** Soma dos casos de todas as doenças (define o tamanho no modo intensidade). */
  cases: number
  /** Doenças do município, da mais grave para a menos grave. */
  items: MapOutbreak[]
  includesDemoData: boolean
}

const severityRank = (key: SeverityKey) => SEVERITY_ORDER.indexOf(key)

export function groupByRegion(outbreaks: MapOutbreak[]): RegionGroup[] {
  const groups = new Map<string, RegionGroup>()
  for (const outbreak of outbreaks) {
    if (!outbreak.coordinates) continue
    let group = groups.get(outbreak.regionId)
    if (!group) {
      group = {
        regionId: outbreak.regionId,
        city: outbreak.city,
        state: outbreak.state,
        coordinates: outbreak.coordinates,
        severity: outbreak.severity,
        cases: 0,
        items: [],
        includesDemoData: false,
      }
      groups.set(outbreak.regionId, group)
    }
    group.items.push(outbreak)
    group.cases += outbreak.cases
    group.includesDemoData ||= outbreak.includesDemoData
    if (severityRank(outbreak.severity) < severityRank(group.severity)) group.severity = outbreak.severity
  }
  for (const group of groups.values()) {
    group.items.sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || b.cases - a.cases)
  }
  return [...groups.values()]
}

/** Créditos do mapa conforme as fontes realmente exibidas. */
export function dataAttribution(outbreaks: MapOutbreak[]): string | null {
  const sources = new Set(outbreaks.flatMap(o => o.sources))
  const parts: string[] = []
  if (sources.has('InfoDengue')) parts.push('Dados: InfoDengue (Fiocruz/FGV)')
  if (outbreaks.some(o => o.includesDemoData)) parts.push('Inclui dados fictícios de demonstração')
  return parts.length > 0 ? parts.join(' | ') : null
}

export interface OutbreakFilters {
  severity?: SeverityKey | 'all'
  search?: string
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Filtros locais (severidade e busca por texto, sem acento); período e doença vão para a API. */
export function filterOutbreaks(outbreaks: MapOutbreak[], { severity = 'all', search = '' }: OutbreakFilters): MapOutbreak[] {
  const query = normalize(search.trim())
  return outbreaks.filter(o => {
    const matchSeverity = severity === 'all' || o.severity === severity
    const matchSearch =
      !query || normalize(o.city).includes(query) || normalize(o.disease).includes(query) || normalize(o.state).includes(query)
    return matchSeverity && matchSearch
  })
}

export function countBySeverity(outbreaks: MapOutbreak[]): Record<SeverityKey, number> {
  const counts: Record<SeverityKey, number> = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 }
  for (const o of outbreaks) counts[o.severity] += 1
  return counts
}

/** "2026-10-04" → "04/10/2026" (sem passar por Date, para não sofrer com fuso). */
export function formatIsoDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** 202640 → "SE 40/2026" */
export function formatEpiWeek(code: number | null): string {
  if (!code) return ''
  return `SE ${code % 100}/${Math.floor(code / 100)}`
}

/** Semana mais recente com dados entre os itens (para "Dados até"). */
export function latestWeek(outbreaks: MapOutbreak[]): string | null {
  return outbreaks.reduce<string | null>((max, o) => (o.latestWeekStart && (!max || o.latestWeekStart > max) ? o.latestWeekStart : max), null)
}

/** Distância aproximada em km (haversine), para ordenar alertas pela proximidade do usuário. */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = (v: number) => (v * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/** Alertas mais graves primeiro; com a localização do usuário, os mais próximos primeiro dentro do mesmo nível. */
export function sortAlertsByRelevance(alerts: Alert[], userCoords: [number, number] | null): Alert[] {
  const dist = (a: Alert) =>
    userCoords && a.latitude !== null && a.longitude !== null ? distanceKm(userCoords, [a.latitude, a.longitude]) : Infinity
  return [...alerts].sort((a, b) => b.alertLevel - a.alertLevel || dist(a) - dist(b))
}
