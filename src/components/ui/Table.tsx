import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T = any> extends React.HTMLAttributes<HTMLTableElement> {
  columns?: Column<T>[];
  data?: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

export function Table<T extends { id?: string | number } = any>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado',
  loading = false,
  children,
  className,
  ...props
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  if (children) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-dark-700 bg-dark-900">
        <table className={cn('w-full text-left border-collapse', className)} {...props}>
          {children}
        </table>
      </div>
    );
  }

  const tableColumns = columns || [];
  const tableData = data || [];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = [...tableData].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = (a as any)[sortKey];
    const bVal = (b as any)[sortKey];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal > bVal ? 1 : -1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-dark-700 bg-dark-900">
      <table className={cn('w-full text-left border-collapse', className)} {...props}>
        <thead>
          <tr className="border-b border-dark-700 bg-dark-800/50 text-sm text-dark-300">
            {tableColumns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-6 py-4 font-medium',
                  col.sortable && 'cursor-pointer hover:text-dark-100 select-none'
                )}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-700 text-sm">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {tableColumns.map((col, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-dark-700 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={tableColumns.length || 1} className="px-6 py-8 text-center text-dark-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item, index) => (
              <tr
                key={item.id || index}
                className={cn(
                  'transition-colors table-row',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {tableColumns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-dark-100">
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
