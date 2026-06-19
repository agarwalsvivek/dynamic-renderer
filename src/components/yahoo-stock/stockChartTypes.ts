export interface StockChartDataPoint {
  date: string;
  value: number;
}

export interface StockChartSeries {
  symbol: string;
  name?: string;
  color?: string;
  data: StockChartDataPoint[];
}

export type StockChartMode = "percent" | "value";

export interface StockChartConfig {
  title?: string;
  mode?: StockChartMode;
  height?: number;
  series: StockChartSeries[];
}

export interface StockChartProps {
  config: StockChartConfig;
}

export const DEFAULT_COLORS = [
  "#378ADD",
  "#1D9E75",
  "#D85A30",
  "#BA7517",
  "#534AB7",
  "#D4537E",
];
