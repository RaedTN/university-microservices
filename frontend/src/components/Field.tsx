type FieldProps = {
  label: string
  name: string
  type?: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  error?: string
}

export function Field({ label, name, type = 'text', value, onChange, autoComplete, error }: FieldProps) {
  return (
    <label htmlFor={name} className="block">
      <span className="block text-base text-muted">{label}</span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-full bg-surface px-5 py-3 text-ink"
      />
      {error ? <span className="mt-2 block">{error}</span> : null}
    </label>
  )
}
