import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'accent' | 'quiet'
}

export function Button({ tone = 'accent', className = '', type = 'button', ...props }: ButtonProps) {
  const look =
    tone === 'accent'
      ? 'bg-accent text-accent-ink enabled:hover:bg-[var(--accent-press)] disabled:bg-surface disabled:text-muted'
      : 'bg-surface text-ink enabled:hover:bg-[color-mix(in_srgb,var(--surface)_80%,var(--ink))] disabled:opacity-45'
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-base outline-offset-3 focus-visible:outline-2 focus-visible:outline-ink enabled:motion-safe:transition-colors enabled:motion-safe:duration-150 enabled:motion-safe:active:translate-y-px ${look} ${className}`}
      {...props}
    />
  )
}
