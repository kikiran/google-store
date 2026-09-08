import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-full hover:bg-ink-100 disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft size={18} />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="px-2 text-ink-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={clsx(
              'w-9 h-9 rounded-full text-sm font-medium transition-colors',
              p === page ? 'bg-brand-600 text-white' : 'hover:bg-ink-100 text-ink-700',
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-full hover:bg-ink-100 disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
