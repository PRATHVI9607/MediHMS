import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`bezel relative w-full ${width}`}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="bezel-core w-full">
              <div className="flex items-start justify-between gap-4 border-b border-line/70 px-6 py-4">
                <div>
                  {title && <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2>}
                  {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-pill p-1.5 text-ink-muted transition-colors hover:bg-surface-overlay hover:text-ink"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
              {footer && (
                <div className="flex justify-end gap-3 border-t border-line/70 px-6 py-4">{footer}</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
