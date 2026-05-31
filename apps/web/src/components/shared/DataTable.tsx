import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CaretUp, CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  // pagination
  page?: number;
  total?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  loading,
  rowKey,
  onRowClick,
  empty,
  page = 1,
  total = 0,
  limit = 20,
  onPageChange,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : rows;

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const align = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');

  return (
    <div className="bezel">
      <div className="bezel-core overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-overlay/60">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-5 py-3.5 text-xs font-bold uppercase tracking-[0.08em] text-ink-secondary',
                      align(col.align),
                      col.sortable && 'cursor-pointer select-none hover:text-gold-dark',
                      col.className
                    )}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <span className={cn('inline-flex items-center gap-1', col.align === 'right' && 'flex-row-reverse')}>
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-6">
                    <TableSkeleton cols={columns.length} />
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>{empty ?? <EmptyState />}</td>
                </tr>
              ) : (
                sorted.map((row, i) => (
                  <motion.tr
                    key={rowKey(row)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.025, 0.25) }}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-t border-line/60 transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-gold-light/10'
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn('px-5 py-3.5 text-sm text-ink', align(col.align), col.className)}
                      >
                        {col.render ? col.render(row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {onPageChange && total > 0 && (
          <div className="flex items-center justify-between border-t border-line/60 px-5 py-3">
            <p className="text-xs text-ink-muted">
              Showing <span className="font-semibold text-ink">{(page - 1) * limit + 1}</span>–
              <span className="font-semibold text-ink">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-ink">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-pill border border-line bg-surface-elevated text-ink-secondary transition-colors hover:border-gold disabled:opacity-40"
              >
                <CaretLeft size={15} />
              </button>
              <span className="px-2 text-xs font-semibold text-ink-secondary">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-pill border border-line bg-surface-elevated text-ink-secondary transition-colors hover:border-gold disabled:opacity-40"
              >
                <CaretRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
