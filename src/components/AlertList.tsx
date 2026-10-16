import type { Alert } from '../types/api'
import { formatEpiWeek, formatIsoDate } from '../utils/outbreaks'

interface AlertListProps {
  alerts: Alert[]
  /** Ids já lidos (aparecem esmaecidos). */
  readIds?: Set<string>
  maxItems?: number
  compact?: boolean
}

const LEVEL_STYLE: Record<number, string> = {
  4: 'bg-red-50 border-red-100 text-red-800',
  3: 'bg-orange-50 border-orange-100 text-orange-800',
  2: 'bg-amber-50 border-amber-100 text-amber-800',
  1: 'bg-emerald-50 border-emerald-100 text-emerald-800',
}

/** Alertas preventivos (GET /api/alerts), com as recomendações em um bloco expansível. */
export default function AlertList({ alerts, readIds, maxItems, compact = false }: AlertListProps) {
  const shown = maxItems ? alerts.slice(0, maxItems) : alerts
  return (
    <ul className="space-y-2">
      {shown.map(alert => (
        <li
          key={alert.id}
          className={`rounded-lg border p-2.5 text-xs ${LEVEL_STYLE[alert.alertLevel] ?? LEVEL_STYLE[3]} ${
            readIds?.has(alert.id) ? 'opacity-60' : ''
          }`}
        >
          <p className="font-semibold">
            {alert.isDemo && (
              <span className="mr-1.5 inline-block rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                Fictício
              </span>
            )}
            {alert.title}
          </p>
          {!compact && <p className="mt-0.5 opacity-90">{alert.message}</p>}
          <p className="mt-1 text-[10px] opacity-75">
            {formatEpiWeek(alert.epiWeek)} · semana de {formatIsoDate(alert.weekStart)} · fonte: {alert.source}
          </p>
          {!compact && (
            <details className="mt-1.5">
              <summary className="cursor-pointer font-medium">Como se prevenir</summary>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {alert.recommendations.map(tip => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </details>
          )}
        </li>
      ))}
    </ul>
  )
}
