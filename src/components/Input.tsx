import React, { InputHTMLAttributes, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  rightElement?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, rightElement, className = '', id, ...props }, ref) => {
    // Associa rótulo, dica e erro ao campo para leitores de tela.
    const autoId = useId()
    const inputId = id ?? props.name ?? autoId
    const hintId = `${inputId}-dica`
    const errorId = `${inputId}-erro`
    const describedBy = error ? errorId : hint ? hintId : undefined

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-emerald-900 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`
              w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200
              bg-white text-slate-800 placeholder:text-slate-400
              transition-all duration-150
              focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15
              disabled:bg-slate-50 disabled:cursor-not-allowed
              ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15' : ''}
              ${rightElement ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightElement}
            </div>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-slate-500">{hint}</p>
        )}
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
