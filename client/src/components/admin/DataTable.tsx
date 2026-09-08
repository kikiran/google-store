import clsx from 'clsx';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';

interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  keyExtractor: (row: T) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  page,
  totalPages,
  onPageChange,
  keyExtractor,
  emptyTitle = 'No data',
  emptyDescription,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200">
            {columns.map((col) => (
              <th key={col.key} className={clsx('text-left py-3 px-4 font-medium text-ink-500', col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="border-b border-ink-100 hover:bg-ink-50/50">
              {columns.map((col) => (
                <td key={col.key} className={clsx('py-3 px-4 text-ink-700', col.className)}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {page !== undefined && totalPages !== undefined && onPageChange && (
        <div className="mt-4 flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
