import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToastStore.getState().push('success', m),
  error: (m: string) => useToastStore.getState().push('error', m),
  info: (m: string) => useToastStore.getState().push('info', m),
};

const ICONS = {
  success: <CheckCircle weight="fill" className="text-status-success" size={22} />,
  error: <WarningCircle weight="fill" className="text-status-error" size={22} />,
  info: <Info weight="fill" className="text-status-info" size={22} />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="bezel pointer-events-auto"
          >
            <div className="bezel-core flex items-center gap-3 px-4 py-3">
              {ICONS[t.kind]}
              <p className="flex-1 text-sm font-medium text-ink">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-pill p-1 text-ink-muted transition-colors hover:bg-surface-overlay hover:text-ink"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
