import React, { useState, useEffect } from "react";
import { ActiveFilter, ColumnSchema, FilterMap } from "../types";
import styles from "./FilterPanel.module.scss";

interface FilterPanelProps {
  columns: ColumnSchema[];
  data: Record<string, unknown>[];
  activeFilters: FilterMap;
  onApply: (filters: FilterMap) => void;
  onClear: () => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  columns,
  data,
  activeFilters,
  onApply,
  onClear,
  onClose,
}) => {
  const [local, setLocal] = useState<FilterMap>({ ...activeFilters });

  useEffect(() => {
    setLocal({ ...activeFilters });
  }, [activeFilters]);

  const filterableCols = columns.filter((c) => c.filterable);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleClear = () => {
    setLocal({});
    onClear();
    onClose();
  };

  const setTextFilter = (key: string, value: string) => {
    if (!value.trim()) {
      setLocal((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    } else {
      setLocal((prev) => ({ ...prev, [key]: { type: "text", value } }));
    }
  };

  const setSelectFilter = (key: string, value: string) => {
    if (!value) {
      setLocal((prev) => {
        const n = { ...prev };
        delete n[key];
        return n;
      });
    } else {
      setLocal((prev) => ({ ...prev, [key]: { type: "select", value } }));
    }
  };

  const setRangeFilter = (key: string, side: "min" | "max", raw: string) => {
    const num = raw === "" ? null : parseFloat(raw);
    setLocal((prev) => {
      const existing = prev[key];
      const current =
        existing?.type === "range"
          ? existing
          : { type: "range" as const, min: null, max: null };
      const next: ActiveFilter = { ...current, [side]: num };
      if (
        (next as { min: null; max: null }).min === null &&
        (next as { min: null; max: null }).max === null
      ) {
        const n = { ...prev };
        delete n[key];
        return n;
      }
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterGrid}>
        {filterableCols.map((col) => (
          <div key={col.key} className={styles.filterGroup}>
            <label className={styles.label}>{col.label}</label>

            {col.filterType === "text" && (
              <input
                type="text"
                placeholder="contains…"
                value={(local[col.key] as { value?: string })?.value ?? ""}
                onChange={(e) => setTextFilter(col.key, e.target.value)}
                className={styles.input}
              />
            )}

            {col.filterType === "select" && (
              <select
                value={(local[col.key] as { value?: string })?.value ?? ""}
                onChange={(e) => setSelectFilter(col.key, e.target.value)}
                className={styles.select}
              >
                <option value="">All</option>
                {[...new Set(data.map((r) => String(r[col.key])))]
                  .sort()
                  .map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
              </select>
            )}

            {col.filterType === "range" &&
              (() => {
                const vals = data
                  .map((r) => parseFloat(String(r[col.key])))
                  .filter((v) => !isNaN(v));
                const mn = Math.floor(Math.min(...vals));
                const mx = Math.ceil(Math.max(...vals));
                const cur = local[col.key];
                const curMin = cur?.type === "range" ? (cur.min ?? "") : "";
                const curMax = cur?.type === "range" ? (cur.max ?? "") : "";
                return (
                  <div className={styles.rangeContainer}>
                    <div className={styles.rangeHint}>
                      {mn} – {mx}
                    </div>
                    <div className={styles.rangeInputsWrapper}>
                      <input
                        type="number"
                        placeholder="min"
                        value={curMin}
                        onChange={(e) =>
                          setRangeFilter(col.key, "min", e.target.value)
                        }
                        className={styles.rangeInput}
                      />
                      <input
                        type="number"
                        placeholder="max"
                        value={curMax}
                        onChange={(e) =>
                          setRangeFilter(col.key, "max", e.target.value)
                        }
                        className={styles.rangeInput}
                      />
                    </div>
                  </div>
                );
              })()}
          </div>
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={handleClear} className={styles.buttonClear}>
          Clear filters
        </button>
        <button onClick={handleApply} className={styles.buttonApply}>
          Apply
        </button>
      </div>
    </div>
  );
};
