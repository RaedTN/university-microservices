import type { ReactNode } from 'react'

const CONTROL =
  'mt-2 w-full rounded-full bg-surface px-5 py-3 text-ink placeholder:text-muted motion-safe:transition-shadow'

const INVALID = 'shadow-[inset_0_0_0_2px_var(--danger)]'

type Shared = {
  label: string
  name: string
  value: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  onChange: (value: string) => void
}

type FieldProps = Shared & {
  type?: string
  placeholder?: string
  autoComplete?: string
  min?: string
  max?: string
  step?: string
}

export function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  required,
  disabled,
  placeholder,
  autoComplete,
  min,
  max,
  step,
}: FieldProps) {
  return (
    <Wrapper label={label} name={name} error={error} hint={hint} required={required}>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} ${error ? INVALID : ''} disabled:text-muted`}
      />
    </Wrapper>
  )
}

type SelectProps = Shared & {
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  hint,
  required,
  disabled,
  placeholder,
}: SelectProps) {
  return (
    <Wrapper label={label} name={name} error={error} hint={hint} required={required}>
      <select
        id={name}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} ${error ? INVALID : ''} disabled:text-muted`}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Wrapper>
  )
}

type AreaProps = Shared & { rows?: number; placeholder?: string }

export function TextAreaField({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
  placeholder,
  rows = 3,
}: AreaProps) {
  return (
    <Wrapper label={label} name={name} error={error} hint={hint} required={required}>
      <textarea
        id={name}
        name={name}
        value={value}
        rows={rows}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, error, hint)}
        onChange={(event) => onChange(event.target.value)}
        className={`${CONTROL} rounded-3xl disabled:text-muted`}
      />
    </Wrapper>
  )
}

function Wrapper({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: string
  name: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} className="block">
        <span className="block text-base text-muted">
          {label}
          {required ? <span className="sr-only"> (required)</span> : null}
        </span>
        {children}
      </label>
      {error ? (
        <p id={`${name}-error`} className="mt-2 text-base text-danger">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={`${name}-hint`} className="mt-2 text-base text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function describedBy(name: string, error?: string, hint?: string) {
  if (error) return `${name}-error`
  if (hint) return `${name}-hint`
  return undefined
}
