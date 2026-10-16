import { Button } from './Button'

type ErrorStateProps = {
  title: string
  detail?: string
  onRetry?: () => void
  retrying?: boolean
}

export function ErrorState({ title, detail, onRetry, retrying }: ErrorStateProps) {
  return (
    <div role="alert" className="bg-surface px-7 py-10">
      <p className="font-display text-4xl text-danger">{title}</p>
      <p className="mt-3 max-w-xl text-muted">{detail || 'The service did not answer. It may be restarting.'}</p>
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Trying again' : 'Try again'}
        </Button>
      ) : null}
    </div>
  )
}
