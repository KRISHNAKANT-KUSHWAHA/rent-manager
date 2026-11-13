import React from 'react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';

const Table = ({
  headers = [],
  children,
  loading = false,
  empty = false,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items matching your criteria.',
  emptyIcon,
  emptyAction,
  className = '',
  tableClassName = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-soft-sm overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              {headers.map((header, idx) => {
                const isObj = typeof header === 'object' && header !== null;
                const label = isObj ? header.label : header;
                const align = isObj ? header.align || 'left' : 'left';
                const width = isObj ? header.width : undefined;

                return (
                  <th
                    key={idx}
                    style={width ? { width } : undefined}
                    className={`py-3.5 px-4 sm:px-5 ${
                      align === 'right'
                        ? 'text-right'
                        : align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700 font-normal">
            {loading ? (
              <tr>
                <td colSpan={headers.length || 1} className="p-8">
                  <div className="space-y-3">
                    <Skeleton className="h-9 w-full" count={4} />
                  </div>
                </td>
              </tr>
            ) : empty ? (
              <tr>
                <td colSpan={headers.length || 1} className="py-12 px-4">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    message={emptyMessage}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;

