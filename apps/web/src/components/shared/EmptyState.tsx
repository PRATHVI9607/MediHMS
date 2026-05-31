import type { ReactNode } from 'react';
import { Tray } from '@phosphor-icons/react';

export function EmptyState({
  icon,
  title = 'Nothing here yet',
  message,
  action,
}: {
  icon?: ReactNode;
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-surface-overlay text-gold shadow-bezel">
        {icon ?? <Tray size={30} />}
      </div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
