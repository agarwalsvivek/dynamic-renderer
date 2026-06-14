export type CellType =
  | 'text'
  | 'currency'
  | 'number'
  | 'percent_change'
  | 'badge'
  | 'progress'
  | 'sparkline'
  | 'avatar_text'
  | 'date'
  | 'link_btn';

export type ActionType = 'drilldown' | 'filter' | 'modal' | 'copy' | 'api';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'gray';

export type FilterType = 'text' | 'select' | 'range';

export interface ColumnAction {
  type: ActionType;
  event: string;
  endpoint?: string;
}

export interface ColumnSchema {
  key: string;
  label: string;
  type: CellType;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  badgeMap?: Record<string, BadgeVariant>;
  label2?: string;
  action?: ColumnAction | null;
}

export interface YAxisSchema {
  key: string;
  label: string;
  color: string;
  yAxisID?: string;
}

export interface XAxisSchema {
  key: string;
  label: string;
  type?: 'category' | 'time';
}

export type RenderType = 'table' | 'chart' | 'hybrid';
export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';

export interface TooltipField {
  key: string;
  type: CellType;
}

export interface TableManifest {
  renderType: 'table';
  title?: string;
  data: Record<string, unknown>[];
  columns: ColumnSchema[];
}

export interface ChartManifest {
  renderType: 'chart';
  title?: string;
  chartType: ChartType;
  xAxis: XAxisSchema;
  yAxes: YAxisSchema[];
  tooltip?: { fields: string[]; types: CellType[] };
  data: Record<string, unknown>[];
}

export type Manifest = TableManifest | ChartManifest;

export interface SortState {
  key: string | null;
  dir: 1 | -1;
}

export type TextFilter = { type: 'text'; value: string };
export type SelectFilter = { type: 'select'; value: string };
export type RangeFilter = { type: 'range'; min: number | null; max: number | null };
export type ActiveFilter = TextFilter | SelectFilter | RangeFilter;
export type FilterMap = Record<string, ActiveFilter>;

export interface ActionEvent {
  type: ActionType;
  event: string;
  row: Record<string, unknown>;
  column: ColumnSchema;
}

export interface TableState {
  sortState: SortState;
  filters: FilterMap;
  searchQuery: string;
  page: number;
  pageSize: number;
}
