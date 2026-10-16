import { AlertTriangle, Check, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

type ToastItem = { id: number; message: string; tone: ToastTone }

type ToastContextValue = {
  push: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const LOOK: Record<ToastTone, string> = {
  success: 'bg-panel text-panel-ink',
  error: 'bg-danger text-danger-ink',
  info: 'bg-panel text-panel-ink',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setItems((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, 4500)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 md:left-auto md:w-96">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className={`dialog-rise pointer-events-auto flex items-start gap-3 px-5 py-3 ${LOOK[item.tone]}`}
          >
            {item.tone === 'error' ? (
              <AlertTriangle size={20} aria-hidden="true" className="mt-1 shrink-0" />
            ) : (
              <Check size={20} aria-hidden="true" className="mt-1 shrink-0" />
            )}
            <p className="flex-1">{item.message}</p>
            <button
              type="button"
              className="mt-1 shrink-0"
              aria-label="Dismiss notice"
              onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
