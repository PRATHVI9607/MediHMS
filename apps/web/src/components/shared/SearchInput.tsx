import { useEffect, useState } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className={cn('relative', className)}>
      <MagnifyingGlass
        size={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
      />
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-pill border border-line bg-surface-elevated pl-11 pr-10 text-sm text-ink placeholder:text-ink-muted transition-all focus-gold"
      />
      {local && (
        <button
          onClick={() => setLocal('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-pill p-1 text-ink-muted hover:bg-surface-overlay hover:text-ink"
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
