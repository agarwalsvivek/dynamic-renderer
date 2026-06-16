import React, { useState } from "react";
import { ActionEvent, ActiveFilter, FilterMap, TableManifest } from "../types";
import { CellRenderer } from "../utils/cellRenderers";
import { useActionDispatch } from "../utils/actionHandlers";
import { useTableState } from "../hooks/useTableState";
import { FilterPanel } from "./FilterPanel";
import styles from "./DataTable.module.scss";

interface DataTableProps {
  manifest: TableManifest;
  onAction?: (event: ActionEvent) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ manifest, onAction }) => {
  const dispatch = useActionDispatch(onAction);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const {
    sortState,
    filters,
    searchQuery,
    page,
    pageSize,
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
  } = useTableState(manifest);

  const filterCount = Object.keys(filters).length;

  const applyFilters = (newFilters: FilterMap) => {
    clearFilters();
    Object.entries(newFilters).forEach(([key, f]) =>
      setFilter(key, f as ActiveFilter),
    );
  };

  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  return (
    <div className={styles.container}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        {/* Global search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            type="text"
            placeholder="Search all columns…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFilterPanelOpen((v) => !v)}
          className={`${styles.toolbarButton} ${styles.filter} ${filterCount > 0 ? styles.hasFilters : ""}`}
        >
          ⚙ Filters
        </button>

        {/* Reset */}
        <button
          onClick={clearAll}
          className={`${styles.toolbarButton} ${styles.reset}`}
        >
          ↺ Reset
        </button>

        {/* Page size */}
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className={styles.pageSelect}
        >
          {[5, 10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      {/* ── Active filter chips ── */}
      {(filterCount > 0 || searchQuery) && (
        <div className={styles.filterChips}>
          {Object.entries(filters).map(([key, f]) => {
            const col = manifest.columns.find((c) => c.key === key);
            const label = col?.label ?? key;
            const val =
              f.type === "range"
                ? `${f.min ?? ""}–${f.max ?? ""}`
                : (f as { value: string }).value;
            return (
              <div key={key} className={styles.chip}>
                {label}: <strong>{val}</strong>
                <button
                  onClick={() => removeFilter(key)}
                  aria-label={`remove ${label} filter`}
                  className={styles.chipRemoveButton}
                >
                  ×
                </button>
              </div>
            );
          })}
          {searchQuery && (
            <div className={styles.chip}>
              Search: <strong>{searchQuery}</strong>
              <button
                onClick={() => setSearchQuery("")}
                className={styles.chipRemoveButton}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Filter panel ── */}
      {filterPanelOpen && (
        <FilterPanel
          columns={manifest.columns}
          data={manifest.data}
          activeFilters={filters}
          onApply={applyFilters}
          onClear={clearFilters}
          onClose={() => setFilterPanelOpen(false)}
        />
      )}

      {/* ── Table ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {manifest.columns.map((col) => {
                const isActive = sortState.key === col.key;
                const indicator = isActive
                  ? sortState.dir === 1
                    ? " ↑"
                    : " ↓"
                  : "";
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && setSort(col.key)}
                    style={{ width: col.width ?? 100 }}
                    className={`${styles.tableHeader} ${col.sortable ? styles.sortable : ""} ${isActive ? styles.active : ""}`}
                  >
                    {col.label}
                    {indicator}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={manifest.columns.length} className={styles.emptyState}>
                  No results match your filters
                </td>
              </tr>
            ) : (
              pagedRows.map((row, ri) => (
                <tr key={String(row.id ?? ri)} className={styles.tableRow}>
                  {manifest.columns.map((col) => {
                    const clickable = !!col.action || col.type === "link_btn";
                    return (
                      <td
                        key={col.key}
                        onClick={() => clickable && dispatch(col, row)}
                        className={`${styles.tableCell} ${clickable ? styles.clickable : ""}`}
                      >
                        <CellRenderer
                          value={row[col.key]}
                          col={col}
                          row={row}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer: row count + pagination ── */}
      <div className={styles.footerSection}>
        <span>
          {totalRows === 0
            ? "No results"
            : `Showing ${start}–${end} of ${totalRows} rows`}
        </span>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

// ─── Pagination sub-component ─────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      totalPages > 7 &&
      i > 2 &&
      i < totalPages - 1 &&
      Math.abs(i - page) > 1
    ) {
      if (i === 3 || i === totalPages - 2) pages.push("…");
    } else {
      pages.push(i);
    }
  }

  return (
    <div className={styles.paginationContainer}>
      <button
        className={styles.paginationButton}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="previous page"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className={styles.paginationEllipsis}>
            …
          </span>
        ) : (
          <button
            key={p}
            className={`${styles.paginationButton} ${page === p ? styles.active : ""}`}
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </button>
        ),
      )}

      <button
        className={styles.paginationButton}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="next page"
      >
        ›
      </button>
    </div>
  );
};
