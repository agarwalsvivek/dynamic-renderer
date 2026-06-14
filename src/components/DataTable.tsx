import React, { useState } from "react";
import { ActionEvent, ActiveFilter, FilterMap, TableManifest } from "../types";
import { CellRenderer } from "../utils/cellRenderers";
import { useActionDispatch } from "../utils/actionHandlers";
import { useTableState } from "../hooks/useTableState";
import { FilterPanel } from "./FilterPanel";

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
    <div style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        {/* Global search */}
        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
          <span
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#888780",
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            ⌕
          </span>
          <input
            type="text"
            placeholder="Search all columns…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 28, width: "100%", fontSize: 12 }}
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFilterPanelOpen((v) => !v)}
          style={{
            fontSize: 12,
            padding: "0 12px",
            height: 36,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          ⚙ Filters
          {filterCount > 0 && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#378ADD",
                display: "inline-block",
              }}
            />
          )}
        </button>

        {/* Reset */}
        <button
          onClick={clearAll}
          style={{
            fontSize: 12,
            padding: "0 12px",
            height: 36,
            color: "#888780",
          }}
        >
          ↺ Reset
        </button>

        {/* Page size */}
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{ fontSize: 12, height: 36 }}
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 10,
          }}
        >
          {Object.entries(filters).map(([key, f]) => {
            const col = manifest.columns.find((c) => c.key === key);
            const label = col?.label ?? key;
            const val =
              f.type === "range"
                ? `${f.min ?? ""}–${f.max ?? ""}`
                : (f as { value: string }).value;
            return (
              <div
                key={key}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: "#E6F1FB",
                  color: "#0C447C",
                  border: "0.5px solid #185FA5",
                }}
              >
                {label}: <strong>{val}</strong>
                <button
                  onClick={() => removeFilter(key)}
                  aria-label={`remove ${label} filter`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#0C447C",
                    fontSize: 13,
                    padding: 0,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
          {searchQuery && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                background: "#E6F1FB",
                color: "#0C447C",
                border: "0.5px solid #185FA5",
              }}
            >
              Search: <strong>{searchQuery}</strong>
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#0C447C",
                  fontSize: 13,
                  padding: 0,
                  lineHeight: 1,
                }}
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
      <div
        style={{
          overflowX: "auto",
          border: "0.5px solid rgba(136,135,128,0.15)",
          borderRadius: 12,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            tableLayout: "fixed",
          }}
        >
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
                    style={{
                      width: col.width ?? 100,
                      fontWeight: 500,
                      fontSize: 11,
                      color: isActive ? "#185FA5" : "#888780",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "0.5px solid rgba(136,135,128,0.15)",
                      whiteSpace: "nowrap",
                      cursor: col.sortable ? "pointer" : "default",
                      userSelect: "none",
                    }}
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
                <td
                  colSpan={manifest.columns.length}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "#888780",
                    fontSize: 13,
                  }}
                >
                  No results match your filters
                </td>
              </tr>
            ) : (
              pagedRows.map((row, ri) => (
                <tr
                  key={String(row.id ?? ri)}
                  style={{ borderBottom: "0.5px solid rgba(136,135,128,0.15)" }}
                >
                  {manifest.columns.map((col) => {
                    const clickable = !!col.action || col.type === "link_btn";
                    return (
                      <td
                        key={col.key}
                        onClick={() => clickable && dispatch(col, row)}
                        style={{
                          padding: "7px 12px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          verticalAlign: "middle",
                          cursor: clickable ? "pointer" : "default",
                        }}
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 10,
          fontSize: 12,
          color: "#888780",
        }}
      >
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
  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    border: active
      ? "0.5px solid #185FA5"
      : "0.5px solid rgba(136,135,128,0.3)",
    background: active ? "#E6F1FB" : "transparent",
    color: active ? "#0C447C" : "#888780",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
  });

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
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <button
        style={btnStyle(false)}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="previous page"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            style={{ padding: "0 4px", color: "#888780" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            style={btnStyle(page === p)}
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </button>
        ),
      )}

      <button
        style={btnStyle(false)}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="next page"
      >
        ›
      </button>
    </div>
  );
};
