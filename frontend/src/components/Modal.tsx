import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

type ModalProps = {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function Modal({ title, description, onClose, children, footer, wide = false }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = panel.current?.querySelector<HTMLElement>(
      'input, select, textarea, button:not([data-close])',
    )
    focusable?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel.current) return
      const stops = Array.from(
        panel.current.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea'),
      ).filter((node) => !node.hasAttribute('disabled'))
      if (stops.length === 0) return
      const first = stops[0]
      const last = stops[stops.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-6">
      <button
        type="button"
        data-close="veil"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="dialog-veil fixed inset-0 cursor-default bg-[color-mix(in_srgb,var(--panel)_86%,transparent)]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`dialog-rise relative my-auto w-full bg-bg text-ink shadow-[0_24px_60px_-24px_rgba(4,16,48,0.6)] ${
          wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'
        }`}
      >
        <div className="flex items-start justify-between gap-5 px-6 pt-7 sm:px-9 sm:pt-9">
          <div>
            <h2 id={titleId} className="text-[clamp(1.9rem,3.4vw,2.6rem)]">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-3 max-w-md text-base text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            data-close="corner"
            aria-label="Close"
            onClick={onClose}
            className="-mt-1 shrink-0 p-1 text-muted motion-safe:transition-colors hover:text-ink"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 pt-7 pb-8 sm:px-9">{children}</div>
        {footer ? <div className="bg-surface px-6 py-5 sm:px-9">{footer}</div> : null}
      </div>
    </div>
  )
}
