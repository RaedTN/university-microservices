import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel: string
  pending?: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="max-w-md">{description}</p>
      {error ? (
        <p role="alert" className="mt-5 text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button tone="danger" onClick={onConfirm} disabled={pending}>
          {pending ? 'Deleting' : confirmLabel}
        </Button>
        <Button tone="quiet" onClick={onCancel} disabled={pending}>
          Keep it
        </Button>
      </div>
    </Modal>
  )
}
