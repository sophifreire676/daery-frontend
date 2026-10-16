// Validação do período escolhido nos filtros de data (mesmos limites da API).
const DAY_MS = 24 * 60 * 60 * 1000
export const MAX_PERIOD_DAYS = 366

export interface PeriodInput {
  startDate: string
  endDate: string
}

/** Mensagem de erro do período, ou null se ele pode ser enviado à API. Datas vazias usam o padrão da API. */
export function periodError({ startDate, endDate }: PeriodInput): string | null {
  if (startDate && endDate) {
    const start = Date.parse(`${startDate}T00:00:00Z`)
    const end = Date.parse(`${endDate}T00:00:00Z`)
    if (start > end) return 'A data inicial precisa ser anterior à data final.'
    if ((end - start) / DAY_MS + 1 > MAX_PERIOD_DAYS) return 'Escolha um período de até 1 ano.'
  }
  const today = new Date().toISOString().slice(0, 10)
  if (startDate && !endDate && startDate > today) return 'A data inicial não pode estar no futuro.'
  return null
}

export function toSummaryPeriod({ startDate, endDate }: PeriodInput) {
  return { ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}) }
}
