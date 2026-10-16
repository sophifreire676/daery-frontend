interface DataStatusProps {
  loading: boolean
  error: string | null
  isEmpty: boolean
  onRetry?: () => void
  emptyText?: string
  /** overlay: cartão centralizado sobre o mapa. inline: texto dentro de listas e painéis. */
  variant?: 'overlay' | 'inline'
}

/** Estados de carregamento, erro e ausência de dados. Não renderiza nada quando há dados. */
export default function DataStatus({
  loading,
  error,
  isEmpty,
  onRetry,
  emptyText = 'Nenhum dado para os filtros escolhidos.',
  variant = 'inline',
}: DataStatusProps) {
  if (!loading && !error && !isEmpty) return null

  const content = loading ? (
    <p className="flex items-center gap-2 text-slate-600">
      <svg className="w-4 h-4 animate-spin text-teal-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Carregando dados…
    </p>
  ) : error ? (
    <div className="text-red-700">
      <p>{error}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 text-sm font-medium text-teal-700 hover:underline">
          Tentar de novo
        </button>
      )}
    </div>
  ) : (
    <p className="text-slate-500">{emptyText}</p>
  )

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 z-[600] flex items-center justify-center pointer-events-none">
        <div
          role={error ? 'alert' : 'status'}
          aria-live="polite"
          className="pointer-events-auto bg-white/95 rounded-xl shadow-lg border border-slate-200 px-5 py-4 text-sm max-w-xs text-center"
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div role={error ? 'alert' : 'status'} aria-live="polite" className="text-sm text-center py-6 px-4">
      {content}
    </div>
  )
}
