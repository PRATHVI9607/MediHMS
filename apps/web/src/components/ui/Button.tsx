import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sky';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-ink bg-gradient-gold shadow-gold hover:shadow-[0_0_32px_rgba(201,168,76,0.45)] border border-gold-dark/20',
  sky: 'text-ink-inverse bg-sky-primary hover:bg-sky-dark shadow-sky border border-sky-dark/20',
  secondary:
    'text-ink bg-surface-elevated border border-line hover:border-gold hover:bg-surface-overlay',
  ghost: 'text-ink-secondary hover:bg-surface-overlay hover:text-ink',
  danger: 'text-ink-inverse bg-status-error hover:brightness-95 border border-black/5',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, trailingIcon, loading, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'group inline-flex select-none items-center justify-center rounded-pill font-semibold',
        'transition-all duration-300 ease-spring active:scale-[0.97] focus-gold',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {!loading && icon}
      {children}
      {trailingIcon && (
        <span className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105">
          {trailingIcon}
        </span>
      )}
    </button>
  );
});
