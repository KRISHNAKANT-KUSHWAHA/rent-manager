import React from 'react';
import { Search, X, Filter } from 'lucide-react';

const SearchFilterBar = ({
  search = '',
  onSearchChange,
  placeholder = 'Search...',
  filters = [],
  children,
  className = '',
  onReset,
}) => {
  const hasActiveFilters = Boolean(
    (search && search.trim().length > 0) ||
      filters.some((f) => f.value && f.value !== 'all' && f.value !== '')
  );

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-soft-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
        {/* Search Input Box */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-50/70 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <div key={filter.id || filter.label} className="relative min-w-[130px]">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-3 pr-8 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            ))}

            {hasActiveFilters && onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Optional action buttons on the right side */}
      {children && (
        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
};

export default SearchFilterBar;

