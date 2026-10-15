import type { ReactNode } from 'react'

export function Empty({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="bg-surface px-7 py-10">
      <p className="font-display text-4xl">{title}</p>
      {detail ? <p className="mt-3 max-w-xl text-muted">{detail}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
