# Dynamic Renderer

**Schema-driven table and chart renderer for React + TypeScript.** Turn a JSON manifest into a fully-interactive data table or Chart.js chart — with sorting, filtering, pagination, custom cell types, and click actions all driven by the schema.

## Features

- 📊 **Tables & Charts** — Render data as rich tables or interactive charts (line, bar) from a single manifest
- 🎨 **11+ Cell Types** — Text, currency, percent change, badges, progress bars, sparklines, avatars, dates, and more
- 🔍 **Smart Filtering** — Text, select, and range filters auto-generated from column schema
- ⬆️ **Sorting & Pagination** — Multi-column sorting, configurable page sizes
- 🎯 **Action Registry** — Define custom handlers for row clicks, drilldowns, and modals
- 📐 **Type Safe** — Full TypeScript support with strict manifest validation
- 🚀 **Zero Config** — Demo app includes 4 preset datasets (funds, sales, users, performance)

## Getting started

### Install dependencies

```bash
npm install
```

### Start dev server

```bash
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) to see the demo.

### Build for production

```bash
npm run build
```

## Project structure

```
src/
├── types/
│   └── index.ts                  # TypeScript interfaces (Manifest, ColumnSchema, etc.)
├── data/
│   └── presets.ts                # 4 sample manifests for demo
├── utils/
│   ├── cellRenderers.tsx         # CellType → React component registry
│   └── actionHandlers.ts         # ActionType → handler registry + useActionDispatch hook
├── hooks/
│   └── useTableState.ts          # Sort, filter, search, pagination state machine
├── components/
│   ├── DynamicRenderer.tsx       # Top-level router: table vs. chart
│   ├── DataTable.tsx             # Sortable, filterable table with toolbar
│   ├── ChartRenderer.tsx         # Chart.js wrapper (line & bar charts)
│   └── FilterPanel.tsx           # Auto-generated filter controls
├── App.tsx                       # Demo app with JSON editor
├── main.tsx                      # React DOM entry point
└── index.ts                      # Barrel exports for library use
```

## Architecture

### 1. The Manifest: Schema as Contract

Every render begins with a **manifest** — a JSON object that describes what to render:

**Table manifest example:**

```json
{
  "renderType": "table",
  "title": "Fund overview",
  "data": [
    {
      "id": "vfiax",
      "name": "VFIAX",
      "category": "Large blend",
      "nav": 628.68,
      "change": 0.023
    }
  ],
  "columns": [
    {
      "key": "name",
      "label": "Fund",
      "type": "text",
      "sortable": true,
      "filterable": true,
      "filterType": "text",
      "action": { "type": "drilldown", "event": "FUND_DETAIL" }
    },
    {
      "key": "change",
      "label": "Change",
      "type": "percent_change",
      "sortable": true
    }
  ]
}
```

**Chart manifest example:**

```json
{
  "renderType": "chart",
  "title": "Quarterly sales by region",
  "chartType": "bar",
  "xAxis": { "key": "quarter", "label": "Quarter" },
  "yAxes": [
    { "key": "north", "label": "North", "color": "#378ADD" },
    { "key": "south", "label": "South", "color": "#1D9E75" }
  ],
  "data": [{ "quarter": "Q1 2025", "north": 420, "south": 310 }]
}
```

### 2. Cell Renderers

`cellRenderers.tsx` maps each `CellType` to a React component. Built-in types:

| Type             | Component             | Example                |
| ---------------- | --------------------- | ---------------------- |
| `text`           | Plain text            | "Apple Inc."           |
| `currency`       | Formatted with $      | $628.68                |
| `number`         | Formatted with commas | "1,234,567"            |
| `percent_change` | ▲/▼ with color        | ▲ 2.30% (green)        |
| `badge`          | Colored label         | info, warning, success |
| `progress`       | Progress bar 0-100    | ████░░░░ 75%           |
| `sparkline`      | Tiny chart (chart.js) | ╱╲╱╲ (inline)          |
| `avatar_text`    | Avatar + text         | [A] "Alice Smith"      |
| `date`           | Formatted date        | Jun 13, 2026           |
| `link_btn`       | Clickable link        | View →                 |

**Add a new cell type:**

1. Create your component (e.g., `StarCell`)
2. Add to `RENDERERS` in `cellRenderers.tsx`
3. Add to `CellType` union in `types/index.ts`

```tsx
// cellRenderers.tsx
const RENDERERS: Record<CellType, React.FC<CellRendererProps>> = {
  // ... existing types
  star: ({ value }) => <StarCell rating={value} />,
};

// types/index.ts
export type CellType =
  | 'text' | 'currency' | 'percent_change' | 'star'  // ← add here
  | // ...
```

### 3. Action Registry

Define custom handlers for row interactions in `actionHandlers.ts`:

```ts
import { actionRegistry } from "./utils/actionHandlers";

// Register a handler for the "drilldown" action type
actionRegistry.register("drilldown", ({ event, row }) => {
  console.log(`User clicked row: ${row.name}`);
  // Navigate, open modal, analytics, etc.
});

actionRegistry.register("modal", ({ event, row }) => {
  openModal({ title: row.name, data: row });
});

actionRegistry.register("export", ({ event, row }) => {
  downloadCSV(row);
});
```

When a user clicks a cell with an `action`, the handler is invoked with the event type, event name, and row data.

### 4. Table State Machine

`useTableState` encapsulates the full filter → sort → paginate pipeline. State flows through:

```
raw data
  ↓ search (searchQuery)
  ↓ column filters (activeFilters)
  ↓ sort (sortState)
  ↓ paginate (page, pageSize)
→ pagedRows (rendered)
```

All derived state uses `useMemo` for efficiency:

```tsx
const {
  filteredRows, // After search & filters
  pagedRows, // Current page
  totalRows, // Filtered row count
  page, // Current page number
  pageSize, // Rows per page
  setPage, // Update page
  setPageSize, // Update page size
  sortState, // { key, order }
  setSortState, // Update sort
  // ... filters
} = useTableState(manifest, {
  initialPage: 1,
  initialPageSize: 5,
});
```

### 5. Filter Panel

`FilterPanel` auto-generates form controls based on `column.filterType`:

- **text** — Single `<input>` for substring match
- **select** — `<select>` with options from unique column values
- **range** — Two number inputs for min/max range

Filters update in real-time; no "Apply" button needed.

## Usage Examples

### Basic Usage

```tsx
import { DynamicRenderer } from "./src";
import { ChartManifest, TableManifest } from "./src/types";

export function MyComponent() {
  const [manifest, setManifest] = useState<
    ChartManifest | TableManifest | null
  >(null);

  return (
    <DynamicRenderer
      manifest={manifest}
      onAction={(event) => {
        console.log("Action:", event.type, event.event, event.row);
      }}
    />
  );
}
```

### With Custom Action Handlers

```tsx
import { actionRegistry } from "./src/utils/actionHandlers";
import { DynamicRenderer } from "./src";

// Register custom handlers before rendering
actionRegistry.register("drilldown", ({ row }) => {
  router.push(`/details/${row.id}`);
});

actionRegistry.register("delete", ({ row }) => {
  if (confirm(`Delete ${row.name}?`)) {
    api.delete(`/items/${row.id}`);
  }
});

export function MyTable({ manifest }) {
  return <DynamicRenderer manifest={manifest} />;
}
```

### Use as a Library

Export the components for use in your own app:

```tsx
import {
  DynamicRenderer, // Main component
  DataTable, // Table only
  ChartRenderer, // Chart only
  useTableState, // State machine hook
  actionRegistry, // Handler registry
} from "dynamic-renderer";
import type { Manifest, TableManifest, ChartManifest } from "dynamic-renderer";
```

## Type Definitions

### Manifest (Union Type)

```ts
export type Manifest = TableManifest | ChartManifest;

export interface TableManifest {
  renderType: "table";
  title?: string;
  data: Record<string, any>[];
  columns: ColumnSchema[];
}

export interface ChartManifest {
  renderType: "chart";
  title?: string;
  chartType: "line" | "bar";
  xAxis: XAxisSchema;
  yAxes: YAxisSchema[];
  data: Record<string, any>[];
}

export interface ColumnSchema {
  key: string;
  label: string;
  type: CellType;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  badgeMap?: Record<string, BadgeVariant>; // For badge cells
  action?: ColumnAction | null;
}

export interface ColumnAction {
  type: ActionType;
  event: string;
}

export type ActionEvent = {
  type: ActionType;
  event: string;
  row: Record<string, any>;
};
```

## Scripts

```bash
# Development
npm run dev          # Start Vite dev server

# Production
npm run build        # TypeScript + Vite build
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript type checker
```

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari 15+

## License

MIT
}

````

### With custom action handlers

```tsx
import { actionRegistry } from './src';

// Register once at app startup
actionRegistry.register('drilldown', ({ event, row }) => {
  if (event === 'FUND_DETAIL') router.push(`/funds/${row.id}`);
  if (event === 'EDIT_USER')   openEditModal(row);
});
````

### Using sub-components directly

```tsx
import { DataTable, ChartRenderer } from './src';

// Table only
<DataTable manifest={tableManifest} onAction={handleAction} />

// Chart only
<ChartRenderer manifest={chartManifest} />
```

## Extending the system

### New cell type

1. Add to `CellType` union in `types/index.ts`
2. Create a React component in `cellRenderers.tsx`
3. Add to the `RENDERERS` map in `cellRenderers.tsx`

### New action type

1. Add to `ActionType` union in `types/index.ts`
2. Add a default handler in `defaultHandlers` in `actionHandlers.ts`

### New filter type

1. Add to `FilterType` union in `types/index.ts`
2. Add a case in `FilterPanel.tsx`
3. Add a filter pass in `useTableState.ts`

## Setup

```bash
npm install
npm run dev        # dev server
npm run typecheck  # type check only
npm run build      # production build
```

## Dependencies

- `react` + `react-dom` — UI
- `chart.js` — chart rendering (auto-imported via `chart.js/auto`)
- `typescript` — type safety
- `vite` — build tool
