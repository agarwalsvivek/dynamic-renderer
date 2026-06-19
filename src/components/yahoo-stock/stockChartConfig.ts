import { DEFAULT_COLORS, type StockChartMode, type StockChartSeries } from "./stockChartTypes";

/** Builds the Chart.js `{ type, data, options }` config for a stock line chart. */
export function buildStockChartConfig(series: StockChartSeries[], mode: StockChartMode) {
  const labels = series[0].data.map((d) => d.date);

  const datasets = series.map((s, i) => {
    const color = s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
    const raw = s.data.map((d) => d.value);
    const open = raw[0];
    const values =
      mode === "percent"
        ? raw.map((v) => (open === 0 ? 0 : ((v - open) / open) * 100))
        : raw;
    return {
      label: s.symbol,
      data: values,
      borderColor: color,
      backgroundColor: color,
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 1.8,
    };
  });

  return {
    type: "line" as const,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#888780",
          bodyColor: "#2C2C2A",
          borderColor: "rgba(0,0,0,0.1)",
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (item: { dataset: { label: string }; raw: number }) =>
              mode === "percent"
                ? ` ${item.dataset.label}: ${item.raw >= 0 ? "+" : ""}${item.raw.toFixed(2)}%`
                : ` ${item.dataset.label}: ${item.raw.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: "#888780", maxTicksLimit: 6 },
        },
        y: {
          grid: { color: "rgba(128,128,128,0.08)" },
          ticks: {
            font: { size: 11 },
            color: "#888780",
            callback: (v: number) => (mode === "percent" ? `${v}%` : v),
          },
        },
      },
    },
  };
}
