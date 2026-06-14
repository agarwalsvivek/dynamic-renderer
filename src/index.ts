// ─── Main component ───────────────────────────────────────────────────────────
export { DynamicRenderer } from "./components/DynamicRenderer";

// ─── Sub-components (for custom layouts) ─────────────────────────────────────
export { DataTable } from "./components/DataTable";
export { ChartRenderer } from "./components/ChartRenderer";
export { FilterPanel } from "./components/FilterPanel";

// ─── Cell renderers (extend or override) ─────────────────────────────────────
export {
  CellRenderer,
  TextCell,
  CurrencyCell,
  NumberCell,
  PercentChangeCell,
  BadgeCell,
  ProgressCell,
  SparklineCell,
  AvatarTextCell,
  DateCell,
  LinkBtnCell,
} from "./utils/cellRenderers";

// ─── Action registry (register custom handlers) ───────────────────────────────
export { actionRegistry, useActionDispatch } from "./utils/actionHandlers";

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useTableState } from "./hooks/useTableState";

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  Manifest,
  TableManifest,
  ChartManifest,
  ColumnSchema,
  ColumnAction,
  YAxisSchema,
  XAxisSchema,
  CellType,
  ActionType,
  ActionEvent,
  BadgeVariant,
  FilterType,
  FilterMap,
  ActiveFilter,
  SortState,
  RenderType,
  ChartType,
} from "./types";

// ─── Preset data (for demos) ──────────────────────────────────────────────────
export { PRESETS } from "./data/presets";
