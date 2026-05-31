import { Modal } from './Modal';
import { Button } from './Button';
import { WarningOctagon } from '@phosphor-icons/react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-md"
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-status-error/12 text-status-error">
          <WarningOctagon size={24} weight="fill" />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-ink-secondary">{message}</p>
      </div>
    </Modal>
  );
}
