import type { ChartSpec } from "@/content/ielts/types";

/* График для Writing Task 1: рисуется кодом (SVG), данные вымышленные. */

const COLORS = ["var(--primary)", "var(--river)", "var(--streak)"];
const WIDTH = 440;
const HEIGHT = 270;
const PAD = { top: 18, right: 10, bottom: 40, left: 44 };

/** Круглые деления шкалы: 0, 5, 10… или 0, 100, 200… — не больше шести. */
function niceScale(value: number): { max: number; ticks: number[] } {
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const step = candidates.find((item) => Math.ceil(value / item) <= 6) ?? 1000;
  const count = Math.max(1, Math.ceil(value / step));
  return { max: step * count, ticks: Array.from({ length: count + 1 }, (_, index) => index * step) };
}

function Legend({ names }: { names: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-bold" aria-hidden>
      {names.map((name, index) => (
        <li key={name} className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ background: COLORS[index % COLORS.length] }} />
          {name}
        </li>
      ))}
    </ul>
  );
}

/** Таблица с теми же данными — для экранного диктора. */
function DataTable({ chart }: { chart: Extract<ChartSpec, { type: "bar" | "line" }> }) {
  return (
    <table className="sr-only">
      <caption>{chart.title}</caption>
      <thead>
        <tr>
          <th scope="col">—</th>
          {chart.series.map((series) => (
            <th key={series.name} scope="col">
              {series.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {chart.categories.map((category, index) => (
          <tr key={category}>
            <th scope="row">{category}</th>
            {chart.series.map((series) => (
              <td key={series.name}>
                {series.values[index]}
                {chart.unit}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ChartView({ chart }: { chart: ChartSpec }) {
  if (chart.type === "table") {
    return (
      <div className="overflow-x-auto rounded-xl border-2 bg-card">
        <table lang="en" className="w-full text-sm">
          <caption className="px-3 pt-3 text-left font-extrabold">{chart.title}</caption>
          <thead>
            <tr className="border-b">
              {chart.columns.map((column, index) => (
                <th key={column} scope="col" className={index === 0 ? "px-3 py-2 text-left" : "px-3 py-2 text-right"}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row[0]} className="border-b last:border-0">
                {row.map((cell, index) =>
                  index === 0 ? (
                    <th key={index} scope="row" className="px-3 py-2 text-left font-semibold">
                      {cell}
                    </th>
                  ) : (
                    <td key={index} className="px-3 py-2 text-right tabular-nums">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const { max, ticks } = niceScale(Math.max(...chart.series.flatMap((series) => series.values)));
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const y = (value: number) => PAD.top + plotH - (value / max) * plotH;
  const band = plotW / chart.categories.length;

  return (
    <figure className="flex flex-col gap-2 rounded-xl border-2 bg-card p-3" lang="en">
      <figcaption className="text-center text-sm font-extrabold">{chart.title}</figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label={`${chart.title}. Данные — в таблице ниже для экранного диктора.`}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" fontSize={12} fill="var(--muted-foreground)">
              {tick}
              {chart.unit}
            </text>
          </g>
        ))}
        {chart.categories.map((category, index) => (
          <text
            key={category}
            x={PAD.left + band * index + band / 2}
            y={HEIGHT - PAD.bottom + 18}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill="var(--foreground)"
          >
            {category}
          </text>
        ))}
        {chart.type === "bar"
          ? chart.series.map((series, seriesIndex) => {
              const barW = Math.min(34, (band * 0.7) / chart.series.length);
              const groupW = barW * chart.series.length + 4 * (chart.series.length - 1);
              return series.values.map((value, index) => {
                const x = PAD.left + band * index + (band - groupW) / 2 + seriesIndex * (barW + 4);
                return (
                  <g key={`${series.name}-${index}`}>
                    <rect
                      x={x}
                      y={y(value)}
                      width={barW}
                      height={Math.max(0, PAD.top + plotH - y(value))}
                      rx={4}
                      fill={COLORS[seriesIndex % COLORS.length]}
                    />
                    <text x={x + barW / 2} y={y(value) - 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--foreground)">
                      {value}
                    </text>
                  </g>
                );
              });
            })
          : chart.series.map((series, seriesIndex) => {
              const points = series.values.map((value, index) => [PAD.left + band * index + band / 2, y(value)] as const);
              return (
                <g key={series.name}>
                  <polyline
                    points={points.map(([px, py]) => `${px},${py}`).join(" ")}
                    fill="none"
                    stroke={COLORS[seriesIndex % COLORS.length]}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                  />
                  {points.map(([px, py], index) => (
                    <circle key={index} cx={px} cy={py} r={4} fill={COLORS[seriesIndex % COLORS.length]} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </g>
              );
            })}
      </svg>
      <Legend names={chart.series.map((series) => series.name)} />
      <DataTable chart={chart} />
    </figure>
  );
}
