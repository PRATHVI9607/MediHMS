import type { ApptStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<ApptStatus, string> = {
  Scheduled: 'bg-sky-light/50 text-sky-dark border-sky/40',
  Completed: 'bg-status-success/15 text-status-success border-status-success/30',
  Cancelled: 'bg-status-error/12 text-status-error border-status-error/30',
  'No-Show': 'bg-status-warning/15 text-status-warning border-status-warning/30',
};

export function StatusBadge({ status }: { status: ApptStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-semibold',
        STATUS_STYLES[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function Badge({
  children,
  tone = 'gold',
  className,
}: {
  children: React.ReactNode;
  tone?: 'gold' | 'sky' | 'neutral';
  className?: string;
}) {
  const tones = {
    gold: 'bg-gold-light/30 text-gold-dark border-gold/40',
    sky: 'bg-sky-light/40 text-sky-dark border-sky/40',
    neutral: 'bg-surface-overlay text-ink-secondary border-line',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
