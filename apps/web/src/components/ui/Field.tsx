import { forwardRef } from 'react';
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

const baseField =
  'w-full rounded-sm border bg-surface-base px-3.5 text-sm text-ink placeholder:text-ink-muted transition-all duration-200 focus-gold disabled:opacity-60';

export function FieldShell({
  label,
  error,
  hint,
  required,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-secondary">
          {label}
          {required && <span className="text-gold-dark">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-status-error">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className, ...rest },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required}>
      <input
        ref={ref}
        className={cn(baseField, 'h-11', error && 'border-status-error', className)}
        {...rest}
      />
    </FieldShell>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, className, children, ...rest },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        className={cn(baseField, 'h-11 cursor-pointer appearance-none bg-[length:1rem] pr-8', error && 'border-status-error', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%239A7A2E' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className, ...rest },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        className={cn(baseField, 'min-h-[90px] resize-y py-2.5', error && 'border-status-error', className)}
        {...rest}
      />
    </FieldShell>
  );
});
