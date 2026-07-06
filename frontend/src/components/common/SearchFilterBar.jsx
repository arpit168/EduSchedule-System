import { useState, useEffect } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import Button from './Button';

export const SearchFilterBar = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onResetFilters,
  hasActiveFilters = false,
  className = '',
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [prevQuery, setPrevQuery] = useState(searchQuery);

  if (searchQuery !== prevQuery) {
    setPrevQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearchChange && localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, onSearchChange, searchQuery]);

  return (
    <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm ${className}`}>
      {/* Search Bar */}
      <div className="relative flex-1 min-w-[240px]">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter, idx) => (
          <div key={filter.key || idx} className="flex items-center gap-1.5">
            {filter.icon && <filter.icon className="w-4 h-4 text-slate-400" />}
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">{filter.placeholder || `All ${filter.label}`}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {(hasActiveFilters || localSearch) && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={() => {
              setLocalSearch('');
              onResetFilters();
            }}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;
