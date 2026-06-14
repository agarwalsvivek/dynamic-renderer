import React, { useEffect, useRef } from "react";
import { ChartManifest } from "../types";
import styles from "./ChartRenderer.module.scss";

interface ChartRendererProps {
  manifest: ChartManifest;
}

// Dynamically import Chart.js only in browser environments
declare global {
  interface Window {
    Chart: typeof import("chart.js").Chart;
  }
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ manifest }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function createChart() {
      if (!canvasRef.current || abortController.signal.aborted) return;

      const labels = manifest.data.map((r) =>
        String(r[manifest.xAxis.key] ?? ""),
      );

      const datasets = manifest.yAxes.map((ax) => ({
        label: ax.label,
        data: manifest.data.map((r) => {
          const v = r[ax.key];
          return typeof v === "number" ? v : parseFloat(String(v));
        }),
        borderColor: ax.color,
        backgroundColor:
          manifest.chartType === "bar" ? ax.color + "cc" : ax.color + "18",
        fill: manifest.chartType !== "bar",
        tension: 0.35,
        pointRadius: manifest.chartType === "bar" ? 0 : 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        borderRadius: manifest.chartType === "bar" ? 4 : 0,
        yAxisID: ax.yAxisID ?? "y",
      }));

      const config = {
        type: manifest.chartType,
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
                  ` ${item.dataset.label}: ${item.raw.toLocaleString()}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: "#888780" },
            },
            y: {
              grid: { color: "rgba(128,128,128,0.08)" },
              ticks: { font: { size: 11 }, color: "#888780" },
            },
          },
        },
      };

      // Destroy previous chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }

      // Dynamically import and create chart
      try {
        const { Chart } = await import("chart.js/auto");

        if (abortController.signal.aborted || !canvasRef.current) return;

        chartInstanceRef.current = new Chart(canvasRef.current, config as any);
      } catch (error) {
        console.error("Failed to create chart:", error);
      }
    }

    createChart();

    return () => {
      abortController.abort();
    };
  }, [manifest]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* Custom legend */}
      <div className={styles.legendContainer}>
        {manifest.yAxes.map((ax) => (
          <span key={ax.key} className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: ax.color }}
            />
            {ax.label}
          </span>
        ))}
      </div>

      {/* Canvas */}
      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={manifest.title ?? "Chart"}
        />
      </div>
    </div>
  );
};
