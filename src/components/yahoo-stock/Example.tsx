import StockChart, { StockChartSeries } from "./StockChart";

// Tiny seeded PRNG so the example data looks the same on every page load.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateTradingDates(end: Date, count: number): string[] {
  const dates: Date[] = [];
  const cur = new Date(end);
  while (dates.length < count) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) dates.unshift(new Date(cur));
    cur.setDate(cur.getDate() - 1);
  }
  return dates.map((d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
}

function generateWalk(
  seed: number,
  count: number,
  start: number,
  drift: number,
  volatility: number,
): number[] {
  const rand = mulberry32(seed);
  const values = [start];
  for (let i = 1; i < count; i++) {
    const change = (rand() - 0.5) * volatility + drift;
    values.push(Math.max(1, values[i - 1] + change));
  }
  return values;
}

function buildSeries(
  symbol: string,
  name: string,
  color: string,
  dates: string[],
  seed: number,
  start: number,
  drift: number,
  volatility: number,
): StockChartSeries {
  const values = generateWalk(seed, dates.length, start, drift, volatility);
  return {
    symbol,
    name,
    color,
    data: dates.map((date, i) => ({ date, value: Number(values[i].toFixed(2)) })),
  };
}

// Example: replace with real data fetched from your API of choice.
const TRADING_DAYS_PER_YEAR = 252;
const tradingDates = generateTradingDates(new Date(), TRADING_DAYS_PER_YEAR);

const sampleSeries: StockChartSeries[] = [
  buildSeries("AAPL", "Apple Inc.", "#378ADD", tradingDates, 1, 150, 0.2, 4),
  buildSeries("MSFT", "Microsoft Corp.", "#1D9E75", tradingDates, 2, 390, 0.27, 6),
  buildSeries("NVDA", "NVIDIA Corp.", "#D85A30", tradingDates, 3, 90, 0.2, 5),
  buildSeries("GOOGL", "Alphabet Inc.", "#BA7517", tradingDates, 4, 140, 0.155, 3.5),
];

function Example() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "1rem",
        gap: "1rem",
      }}
    >
      {/* Multi-series, normalized to % change — good for comparing tickers
          at very different price levels. */}
      <StockChart
        config={{
          title: "Big tech · 1 year performance",
          mode: "percent",
          series: sampleSeries,
        }}
      />

      {/* Single series, raw price values. */}
      <StockChart
        config={{
          title: "AAPL · 1 year price",
          mode: "value",
          series: [sampleSeries[0]],
        }}
      />
    </div>
  );
}

export default Example;
