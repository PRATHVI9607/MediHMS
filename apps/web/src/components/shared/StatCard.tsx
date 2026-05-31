import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon,
  accent = 'gold',
  delta,
  index = 0,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: 'gold' | 'sky' | 'success';
  delta?: string;
  index?: number;
}) {
  const accents = {
    gold: 'from-gold-light/40 to-transparent text-gold-dark',
    sky: 'from-sky-light/50 to-transparent text-sky-dark',
    success: 'from-status-success/20 to-transparent text-status-success',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.32, 0.72, 0, 1] }}
      className="bezel group"
    >
      <div className="bezel-core relative overflow-hidden p-5">
        <div
          className={cn(
            'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br blur-xl transition-opacity duration-500 group-hover:opacity-100 opacity-70',
            accents[accent]
          )}
        />
        <div className="relative flex items-start justify-between">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br shadow-bezel',
              accents[accent]
            )}
          >
            {icon}
          </div>
          {delta && (
            <span className="rounded-pill bg-status-success/12 px-2 py-0.5 text-xs font-semibold text-status-success">
              {delta}
            </span>
          )}
        </div>
        <p className="relative mt-4 font-display text-3xl font-bold leading-none text-ink sm:text-4xl">{value}</p>
        <p className="relative mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted sm:text-xs">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
