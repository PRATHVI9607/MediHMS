import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** padding applied to the inner core */
  bodyClassName?: string;
}

/** Double-bezel card: machined outer shell + inner core (high-end skill §4A). */
export function Card({ children, className, bodyClassName, ...rest }: CardProps) {
  return (
    <div className={cn('bezel', className)} {...rest}>
      <div className={cn('bezel-core p-5', bodyClassName)}>{children}</div>
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-overlay text-gold-dark shadow-bezel">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-body text-base font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
