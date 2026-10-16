import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  standfirst: ReactNode
  action?: ReactNode
}

/** Title on the 42% axis, standfirst hanging to its right, as the printed-report direction asks. */
export function PageHeader({ title, standfirst, action }: PageHeaderProps) {
  return (
    <header className="grid gap-6 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)] lg:items-end">
      <h1 className="max-w-[11ch] text-[clamp(2.75rem,5.5vw,5rem)]">
        <span className="reveal-line">
          <span>{title}</span>
        </span>
      </h1>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <p className="max-w-[42ch] text-muted">{standfirst}</p>
        {action}
      </div>
    </header>
  )
}

export function Facts({ children }: { children: ReactNode }) {
  return <dl className="mt-12 flex flex-wrap justify-between gap-8">{children}</dl>
}

export function Fact({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="tnum font-display text-[clamp(2.5rem,4vw,3.5rem)] leading-none">{value}</dd>
      <p aria-hidden="true" className="mt-2 text-base text-muted">
        {label}
      </p>
    </div>
  )
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl">{title}</h2>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}
