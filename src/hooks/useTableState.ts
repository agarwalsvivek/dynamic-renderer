import { useState, useMemo, useCallback } from 'react';
import { ActiveFilter, FilterMap, SortState, TableManifest } from '../types';

const DEFAULT_PAGE_SIZE = 5;

export interface UseTableStateReturn {
  // State
  sortState: SortState;
  filters: FilterMap;
  searchQuery: string;
  page: number;
  pageSize: number;
  // Derived
  filteredRows: Record<string, unknown>[];
  pagedRows: Record<string, unknown>[];
  totalRows: number;
  totalPages: number;
  // Actions
  setSort: (key: string) => void;
  setFilter: (key: string, filter: ActiveFilter) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  clearAll: () => void;
  setSearchQuery: (q: string) => void;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
}

export function useTableState(manifest: TableManifest): UseTableStateReturn {
  const [sortState, setSortState] = useState<SortState>({ key: null, dir: 1 });
  const [filters, setFilters] = useState<FilterMap>({});
  const [searchQuery, setSearchQueryState] = useState('');
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  // ─── Sort ──────────────────────────────────────────────────────────────────
  const setSort = useCallback((key: string) => {
    setSortState((prev) => ({
      key,
      dir: prev.key === key ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
    setPageState(1);
  }, []);

  // ─── Filters ───────────────────────────────────────────────────────────────
  const setFilter = useCallback((key: string, filter: ActiveFilter) => {
    setFilters((prev) => ({ ...prev, [key]: filter }));
    setPageState(1);
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPageState(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPageState(1);
  }, []);

  // ─── Search ────────────────────────────────────────────────────────────────
  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
    setPageState(1);
  }, []);

  // ─── Reset all ────────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setSortState({ key: null, dir: 1 });
    setFilters({});
    setSearchQueryState('');
    setPageState(1);
  }, []);

  // ─── Page size ────────────────────────────────────────────────────────────
  const setPageSize = useCallback((s: number) => {
    setPageSizeState(s);
    setPageState(1);
  }, []);

  const setPage = useCallback((p: number) => {
    setPageState(p);
  }, []);

  // ─── Derived: filter + sort pipeline ─────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = [...manifest.data];

    // Global search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    // Column filters
    Object.entries(filters).forEach(([key, f]) => {
      if (f.type === 'text') {
        rows = rows.filter((row) =>
          String(row[key] ?? '').toLowerCase().includes(f.value.toLowerCase())
        );
      } else if (f.type === 'select') {
        rows = rows.filter((row) => String(row[key]) === f.value);
      } else if (f.type === 'range') {
        rows = rows.filter((row) => {
          const v = parseFloat(String(row[key]));
          if (f.min !== null && v < f.min) return false;
          if (f.max !== null && v > f.max) return false;
          return true;
        });
      }
    });

    // Sort
    if (sortState.key) {
      const key = sortState.key;
      rows.sort((a, b) => {
        const va = a[key];
        const vb = b[key];
        const na = parseFloat(String(va));
        const nb = parseFloat(String(vb));
        let ca: number | string = String(va);
        let cb: number | string = String(vb);
        if (!isNaN(na) && !isNaN(nb)) { ca = na; cb = nb; }
        return (ca < cb ? -1 : ca > cb ? 1 : 0) * sortState.dir;
      });
    }

    return rows;
  }, [manifest.data, searchQuery, filters, sortState]);

  // ─── Derived: pagination ──────────────────────────────────────────────────
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(
    () => filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRows, safePage, pageSize]
  );

  return {
    sortState,
    filters,
    searchQuery,
    page: safePage,
    pageSize,
    filteredRows,
    pagedRows,
    totalRows,
    totalPages,
    setSort,
    setFilter,
    removeFilter,
    clearFilters,
    clearAll,
    setSearchQuery,
    setPage,
    setPageSize,
  };
}
