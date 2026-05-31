import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-7"
    >
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-2 inline-block rounded-pill border border-gold/40 bg-gold-light/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-dark">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-3xl font-bold leading-none text-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm text-ink-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </motion.div>
  );
}
