import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'accent' | 'quiet' | 'danger'
}

const LOOK: Record<'accent' | 'quiet' | 'danger', string> = {
  accent: 'bg-accent text-accent-ink enabled:hover:bg-[var(--accent-press)] disabled:bg-surface disabled:text-muted',
  quiet: 'bg-surface text-ink enabled:hover:bg-[color-mix(in_srgb,var(--surface)_80%,var(--ink))] disabled:opacity-45',
  danger:
    'bg-danger text-danger-ink enabled:hover:bg-[color-mix(in_srgb,var(--danger)_84%,var(--ink))] disabled:opacity-45',
}

export function Button({ tone = 'accent', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-base outline-offset-3 focus-visible:outline-2 focus-visible:outline-ink enabled:motion-safe:transition-colors enabled:motion-safe:duration-150 enabled:motion-safe:active:translate-y-px ${LOOK[tone]} ${className}`}
      {...props}
    />
  )
}
