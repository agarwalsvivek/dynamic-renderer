import { useEffect, useRef } from "react";
import styles from "./stock-chart.module.scss";
import { buildStockChartConfig } from "./stockChartConfig";
import { DEFAULT_COLORS, type StockChartProps } from "./stockChartTypes";

/**
 * StockChart
 *
 * Renders a multi-line stock chart from a single JSON-serializable config
 * object, the same way Highcharts/`Chart.js` take a declarative options
 * object instead of hand-written drawing code.
 *
 * Example config:
 * {
 *   "title": "Big tech · performance",
 *   "mode": "percent",
 *   "height": 300,
 *   "series": [
 *     { "symbol": "AAPL", "name": "Apple Inc.", "color": "#378ADD",
 *       "data": [{ "date": "Jun 12", "value": 197.8 }, ...] }
 *   ]
 * }
 */

export type {
  StockChartDataPoint,
  StockChartSeries,
  StockChartMode,
  StockChartConfig,
  StockChartProps,
} from "./stockChartTypes";

export default function StockChart({ config }: StockChartProps) {
  const { title, mode = "percent", height = 300, series } = config;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<{ destroy: () => void } | null>(null);

  const hasData = series.length > 0 && series[0].data.length > 0;
  const lastDate = hasData ? series[0].data[series[0].data.length - 1].date : "";

  useEffect(() => {
    if (!hasData) return;
    const controller = new AbortController();

    async function render() {
      const canvas = canvasRef.current;
      if (!canvas || controller.signal.aborted) return;

      const chartConfig = buildStockChartConfig(series, mode);

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      try {
        const { Chart } = await import("chart.js/auto");
        if (controller.signal.aborted || !canvasRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chartRef.current = new Chart(canvas, chartConfig as any);
      } catch (error) {
        console.error("Failed to create chart:", error);
      }
    }

    render();

    return () => {
      controller.abort();
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [series, mode, hasData]);

  if (!hasData) {
    return <div className={styles.noData}>No data provided.</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.headerDate}>{lastDate}</div>
      </div>

      <div className={styles.canvasWrapper} style={{ height }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={title ?? `Line chart of ${series.map((s) => s.symbol).join(", ")}`}
        />
      </div>

      <div className={styles.legend}>
        {series.map((s, i) => (
          <span key={s.symbol} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
            />
            {s.symbol}
          </span>
        ))}
      </div>
    </div>
  );
}
