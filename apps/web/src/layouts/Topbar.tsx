import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignOut, CaretDown, ShieldCheck } from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { initials } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function Topbar() {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line/60 bg-surface-base/80 px-5 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <span className="hidden font-medium text-ink-secondary sm:inline">Precision Care.</span>
        <span className="bg-gradient-to-r from-gold-dark to-sky-dark bg-clip-text font-display text-lg font-semibold text-transparent">
          Zero Chaos.
        </span>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-pill border border-line bg-surface-elevated py-1.5 pl-1.5 pr-3 transition-all hover:border-gold hover:shadow-sm"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-xs font-bold text-ink">
            {initials(user?.name)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold leading-tight text-ink">{user?.name}</span>
            <span className="block text-[10px] leading-tight text-ink-muted">{user?.role}</span>
          </span>
          <CaretDown size={14} className="text-ink-muted" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="bezel absolute right-0 top-12 w-60"
            >
              <div className="bezel-core p-2">
                <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold text-sm font-bold text-ink">
                    {initials(user?.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                    <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                  </div>
                </div>
                <div className="px-3 py-1.5">
                  <Badge tone="gold">
                    <ShieldCheck size={12} weight="fill" /> {user?.role}
                  </Badge>
                </div>
                <div className="my-1 h-px bg-line/70" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-status-error transition-colors hover:bg-status-error/10"
                >
                  <SignOut size={18} /> Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
