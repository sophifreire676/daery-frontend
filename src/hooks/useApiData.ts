import { useCallback, useEffect, useRef, useState } from 'react'
import { getAlerts, getCaseSummary, getDiseases } from '../services/api'
import type { Alert, AlertFilters, Disease, SummaryFilters, SummaryResponse } from '../types/api'
import { friendlyError } from '../utils/errorMessages'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * Carrega dados da API e refaz a chamada quando `key` muda (filtros serializados).
 * Cancela a requisição anterior para que uma resposta antiga não sobrescreva a nova.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, key: string, enabled = true): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const loadRef = useRef(load)
  loadRef.current = load

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loadRef
      .current(controller.signal)
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        if ((err as Error).name === 'AbortError') return
        setError(friendlyError(err))
        setLoading(false)
      })
    return () => controller.abort()
  }, [key, enabled, attempt])

  const reload = useCallback(() => setAttempt(a => a + 1), [])
  return { data, loading, error, reload }
}

export function useCaseSummary(filters: SummaryFilters, enabled = true): AsyncState<SummaryResponse> {
  return useAsync(signal => getCaseSummary(filters, signal), JSON.stringify(filters), enabled)
}

export function useAlerts(filters: AlertFilters = {}): AsyncState<Alert[]> {
  return useAsync(signal => getAlerts(filters, signal), JSON.stringify(filters))
}

export function useDiseases(): AsyncState<Disease[]> {
  return useAsync(signal => getDiseases(signal), 'diseases')
}
