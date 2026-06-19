import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import styles from "./stock-chart.module.scss";

/**
 * StockChart
 *
 * A reusable, canvas-based multi-line stock chart with hover crosshair,
 * tooltip, and a left-side percent-change axis. Pure data-in component —
 * no network calls, no fake data generation. Bring your own series.
 *
 * ---- Props ----
 *
 * series: Array<{
 *   symbol: string;            // e.g. "AAPL"
 *   name?: string;             // e.g. "Apple Inc."
 *   color?: string;            // hex color for the line, auto-assigned if omitted
 *   data: Array<{
 *     date: string;            // label shown on x-axis / tooltip, e.g. "Jun 12" or "2026-06-12"
 *     value: number;           // raw price (or any unit) at this point
 *   }>;
 * }>
 *
 * mode: "percent" | "value"
 *   "percent" (default) — normalizes each series to % change from its first
 *     data point, so tickers with very different price levels can share one
 *     y-axis (this is what Yahoo/Google Finance do for multi-line compares).
 *   "value" — plots raw values directly. Best for a single series, or
 *     multiple series that are already on comparable scales.
 *
 * height: number — chart height in px (default 260)
 * title: string — small label above the price/header line
 * xAxisLabels: string[] — optional override for which date labels to show
 *   under the chart. Defaults to evenly spaced unique dates from the data.
 *
 * ---- Usage ----
 *
 * <StockChart
 *   title="Big tech · 5 day performance"
 *   mode="percent"
 *   series={[
 *     { symbol: "AAPL", name: "Apple Inc.", color: "#378ADD", data: [...] },
 *     { symbol: "MSFT", name: "Microsoft Corp.", color: "#1D9E75", data: [...] },
 *   ]}
 * />
 */

const DEFAULT_COLORS = [
  "#378ADD", // blue
  "#1D9E75", // teal
  "#D85A30", // coral
  "#BA7517", // amber
  "#534AB7", // purple
  "#D4537E", // pink
];

function useThemeColors() {
  const [isDark, setIsDark] = useState(
    typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler);
    };
  }, []);

  return useMemo(
    () => ({
      isDark,
      grid: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      crosshair: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)",
      zeroLine: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
      dotStroke: isDark ? "#000000" : "#ffffff",
      textPrimary: isDark ? "#f2f2f0" : "#18181b",
      textSecondary: isDark ? "#a6a6a3" : "#6b6b68",
      textTertiary: isDark ? "#7a7a77" : "#9c9c98",
      background: isDark ? "#1c1c1e" : "#ffffff",
      border: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
    }),
    [isDark]
  );
}

interface StockChartDataPoint {
  date: string;
  value: number;
}

export interface StockChartSeries {
  symbol: string;
  name?: string;
  color?: string;
  data: StockChartDataPoint[];
}

interface PlotSeries {
  symbol: string;
  name: string;
  color: string;
  values: number[];
  raw: number[];
}

export type StockChartMode = "percent" | "value";

export interface StockChartProps {
  series?: StockChartSeries[];
  mode?: StockChartMode;
  height?: number;
  title?: string;
  xAxisLabels?: string[] | null;
}

export default function StockChart({
  series = [],
  mode = "percent",
  height = 260,
  title = "",
  xAxisLabels = null,
}: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number }>({ width: 0, height });
  const theme = useThemeColors();

  const hasData = series.length > 0 && series[0].data && series[0].data.length > 0;
  const n = hasData ? series[0].data.length : 0;

  // Normalize series into plottable values + assign colors.
  const plotSeries: PlotSeries[] = useMemo(() => {
    return series.map((s, i) => {
      const color = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      const raw = (s.data || []).map((d) => d.value);
      let values = raw;
      if (mode === "percent" && raw.length > 0) {
        const open = raw[0];
        values = raw.map((v) => (open === 0 ? 0 : ((v - open) / open) * 100));
      }
      return {
        symbol: s.symbol,
        name: s.name || s.symbol,
        color,
        values,
        raw,
      };
    });
  }, [series, mode]);

  const dates = useMemo(() => {
    if (!hasData) return [];
    return series[0].data.map((d) => d.date);
  }, [series, hasData]);

  const axisLabels = useMemo(() => {
    if (xAxisLabels) return xAxisLabels;
    // Default: dedupe consecutive duplicates, cap to ~6 labels evenly spaced.
    const unique: string[] = [];
    dates.forEach((d) => {
      if (unique[unique.length - 1] !== d) unique.push(d);
    });
    if (unique.length <= 6) return unique;
    const step = (unique.length - 1) / 5;
    const out: string[] = [];
    for (let i = 0; i <= 5; i++) {
      out.push(unique[Math.round(i * step)]);
    }
    return out;
  }, [dates, xAxisLabels]);

  const { yMin, yMax } = useMemo(() => {
    let all: number[] = [];
    plotSeries.forEach((s) => {
      all = all.concat(s.values);
    });
    if (mode === "percent") all.push(0);
    if (all.length === 0) return { yMin: 0, yMax: 1 };
    const min = Math.min(...all);
    const max = Math.max(...all);
    const padRange = (max - min) * 0.15 || (mode === "percent" ? 0.5 : 1);
    return { yMin: min - padRange, yMax: max + padRange };
  }, [plotSeries, mode]);

  const pad = { left: 4, right: 4, top: 16, bottom: 8 };

  const scaleX = useCallback(
    (i: number) => pad.left + (i / Math.max(1, n - 1)) * (dims.width - pad.left - pad.right),
    [dims.width, n]
  );

  const scaleY = useCallback(
    (v: number) => {
      const usable = dims.height - pad.top - pad.bottom;
      return pad.top + (1 - (v - yMin) / (yMax - yMin)) * usable;
    },
    [dims.height, yMin, yMax]
  );

  // Resize observer keeps canvas crisp on container width changes.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setDims({ width: rect.width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  // Draw loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dims.width * dpr;
    canvas.height = dims.height * dpr;
    canvas.style.width = dims.width + "px";
    canvas.style.height = dims.height + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, dims.width, dims.height);

    // Horizontal gridlines (4 internal divisions).
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let g = 0; g <= gridLines; g++) {
      const val = yMin + (g / gridLines) * (yMax - yMin);
      const y = scaleY(val);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(dims.width - pad.right, y);
      ctx.stroke();
    }

    // Vertical gridlines at axis-label boundaries.
    if (n > 1 && axisLabels.length > 1) {
      for (let d = 1; d < axisLabels.length; d++) {
        const idx = Math.round((d / (axisLabels.length - 1)) * (n - 1));
        const x = scaleX(idx);
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, dims.height - pad.bottom);
        ctx.stroke();
      }
    }

    // Zero line for percent mode.
    if (mode === "percent") {
      ctx.strokeStyle = theme.zeroLine;
      ctx.lineWidth = 1;
      const zy = scaleY(0);
      ctx.beginPath();
      ctx.moveTo(pad.left, zy);
      ctx.lineTo(dims.width - pad.right, zy);
      ctx.stroke();
    }

    // Lines.
    plotSeries.forEach((s) => {
      ctx.beginPath();
      s.values.forEach((v, i) => {
        const x = scaleX(i);
        const y = scaleY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.stroke();
    });

    // Hover crosshair + dots.
    if (hoverIdx !== null && hoverIdx >= 0 && hoverIdx < n) {
      const hx = scaleX(hoverIdx);
      ctx.strokeStyle = theme.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, pad.top);
      ctx.lineTo(hx, dims.height - pad.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      plotSeries.forEach((s) => {
        const v = s.values[hoverIdx];
        const y = scaleY(v);
        ctx.beginPath();
        ctx.arc(hx, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = theme.dotStroke;
        ctx.stroke();
      });
    }
  }, [dims, plotSeries, hoverIdx, n, mode, theme, scaleX, scaleY, yMin, yMax, axisLabels.length]);

  const yAxisTicks = useMemo(() => {
    const ticks: { y: number; label: string }[] = [];
    const gridLines = 4;
    for (let g = 0; g <= gridLines; g++) {
      const val = yMin + (g / gridLines) * (yMax - yMin);
      const y = scaleY(val);
      const label = mode === "percent" ? (val >= 0 ? "+" : "") + val.toFixed(1) + "%" : val.toFixed(2);
      ticks.push({ y, label });
    }
    return ticks;
  }, [yMin, yMax, mode, scaleY]);

  function handleMouseMove(e: ReactMouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frac = (x - pad.left) / (dims.width - pad.left - pad.right);
    const idx = Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
    setHoverIdx(idx);
    setTooltipIdx(idx);
  }

  function handleTouchMove(e: ReactTouchEvent<HTMLCanvasElement>) {
    if (e.touches.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const frac = (x - pad.left) / (dims.width - pad.left - pad.right);
    const idx = Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
    setHoverIdx(idx);
    setTooltipIdx(idx);
  }

  const hoverLabel = hoverIdx !== null && dates[hoverIdx] ? dates[hoverIdx] : null;
  const headerLabel = hoverLabel || (mode === "percent" ? "% change" : "value");

  // Tooltip horizontal placement: flip to the left of the cursor near the right edge.
  // Uses tooltipIdx (not hoverIdx) so the box keeps its last position while fading out.
  const hoverX = tooltipIdx !== null ? scaleX(tooltipIdx) : 0;
  const tooltipWidth = 150;
  const tooltipLeft =
    hoverX + 12 + tooltipWidth > dims.width ? Math.max(0, hoverX - tooltipWidth - 12) : hoverX + 12;

  const themeVars = {
    "--chart-bg": theme.background,
    "--chart-border": theme.border,
    "--chart-text-primary": theme.textPrimary,
    "--chart-text-secondary": theme.textSecondary,
    "--chart-text-tertiary": theme.textTertiary,
  } as CSSProperties;

  if (!hasData) {
    return (
      <div className={styles.noData} style={themeVars}>
        No data provided.
      </div>
    );
  }

  return (
    <div className={styles.root} style={themeVars}>
      <div className={styles.headerRow}>
        <div>
          {title && <div className={styles.title}>{title}</div>}
          <div className={styles.headerLabel}>{headerLabel}</div>
        </div>
        <div className={styles.headerDate}>{n > 0 ? dates[n - 1] : ""}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.yAxis} style={{ height }}>
          {yAxisTicks.map((t, i) => (
            <div key={i} className={styles.yAxisTick} style={{ top: t.y }}>
              {t.label}
            </div>
          ))}
        </div>

        <div ref={wrapRef} className={styles.chartArea} style={{ height }}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Line chart of ${plotSeries.map((s) => s.symbol).join(", ")}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIdx(null)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setHoverIdx(null)}
            className={styles.canvas}
          />

          <div
            className={`${styles.tooltip} ${hoverIdx !== null ? styles.tooltipVisible : ""}`}
            style={{ left: tooltipLeft }}
          >
            {plotSeries.map((s) => {
              const v = s.values[tooltipIdx ?? 0];
              const sign = v >= 0 ? "+" : "";
              const display =
                mode === "percent" ? `${sign}${v.toFixed(2)}%` : v.toFixed(2);
              return (
                <div key={s.symbol} className={styles.tooltipRow}>
                  <span className={styles.tooltipSymbol}>
                    <span className={styles.tooltipDot} style={{ background: s.color }} />
                    {s.symbol}
                  </span>
                  <span>{display}</span>
                </div>
              );
            })}
            <div className={styles.tooltipDate}>{dates[tooltipIdx ?? 0]}</div>
          </div>
        </div>
      </div>

      <div className={styles.axisLabels}>
        {axisLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className={styles.legend}>
        {plotSeries.map((s) => (
          <span key={s.symbol} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            {s.symbol}
          </span>
        ))}
      </div>
    </div>
  );
}
