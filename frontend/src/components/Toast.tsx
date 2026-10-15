import { X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastItem = { id: number; message: string }

type ToastContextValue = {
  push: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setItems((current) => [...current, { id, message }])
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, 4500)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 flex flex-col gap-2 md:left-auto md:w-96">
        {items.map((item) => (
          <div key={item.id} role="status" className="pointer-events-auto flex items-start gap-3 bg-panel px-5 py-3 text-panel-ink">
            <p className="flex-1 text-panel-ink">{item.message}</p>
            <button
              type="button"
              className="text-panel-ink"
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
