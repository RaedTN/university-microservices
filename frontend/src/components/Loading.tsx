export function Loading({ label = 'Loading the register' }: { label?: string }) {
  return (
    <p className="font-display text-4xl text-muted" role="status">
      {label}
    </p>
  )
}
