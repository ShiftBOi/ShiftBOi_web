"use client";

import { Badge } from "@/components/reui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "cn";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";

export type SeriesPoint = {
  day: string;
  date: string;
  visitors: number;
};

const trafficConfig = {
  visitors: { label: "Visits", color: "var(--cms-accent)" },
} satisfies ChartConfig;

const sparkConfig = {
  visitors: { label: "Leads", color: "var(--cms-accent)" },
} satisfies ChartConfig;

/** Full-width range / spike bars with peak callout */
export function TrafficRangeChart({
  series,
  total,
  changePct,
  peak,
}: {
  series: SeriesPoint[];
  total: number;
  changePct: number | null;
  peak: { date: string; day: string; visitors: number } | null;
}) {
  const up = changePct != null && changePct >= 0;
  const points =
    series.length > 0
      ? series
      : Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - (13 - i));
          return {
            date: d.toISOString().slice(0, 10),
            day: d.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
            }),
            visitors: 0,
          };
        });

  const peakDate = peak?.date;

  return (
    <div className="cms-dash-traffic">
      <header className="cms-dash-traffic__head">
        <div>
          <h2 className="cms-dash-traffic__title">
            Website traffic
            {changePct != null ? (
              <Badge
                variant={up ? "success-light" : "destructive-light"}
                className="ml-2"
              >
                {up ? (
                  <TrendingUpIcon aria-hidden="true" />
                ) : (
                  <TrendingDownIcon aria-hidden="true" />
                )}
                {up ? "+" : ""}
                {changePct}%
              </Badge>
            ) : null}
          </h2>
          <p className="cms-dash-traffic__desc">
            Public page views · last {points.length} days ·{" "}
            <strong>{total.toLocaleString()}</strong> visits
            {total === 0 ? " · open the public site to start counting" : ""}
          </p>
        </div>
        {peak && peak.visitors > 0 ? (
          <div className="cms-dash-peak">
            <span className="cms-dash-peak__label">Peak day</span>
            <span className="cms-dash-peak__value">{peak.visitors}</span>
            <span className="cms-dash-peak__meta">{peak.day}</span>
          </div>
        ) : null}
      </header>

      <ChartContainer config={trafficConfig} className="cms-dash-traffic__chart">
        <BarChart
          accessibilityLayer
          data={points}
          margin={{ top: 20, right: 8, bottom: 4, left: 8 }}
        >
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <ChartTooltip
            cursor={{ fill: "var(--cms-hover)" }}
            content={
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as SeriesPoint | undefined;
                  return row?.date || "—";
                }}
              />
            }
          />
          <Bar dataKey="visitors" radius={[5, 5, 2, 2]} maxBarSize={28}>
            {points.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  entry.date === peakDate
                    ? "var(--cms-accent)"
                    : "color-mix(in srgb, var(--cms-accent) 28%, transparent)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

/** Horizontal lollipop / dumbbell for top paths */
export function PathLollipops({
  paths,
  total,
}: {
  paths: Array<{ path: string; label: string; count: number }>;
  total: number;
}) {
  const max = Math.max(...paths.map((p) => p.count), 1);

  return (
    <div className="cms-dash-card">
      <header className="cms-dash-card__head">
        <h3 className="cms-dash-card__title">Top paths</h3>
        <span className="cms-dash-card__hint">Public site · 14 days</span>
      </header>
      {paths.length === 0 ? (
        <p className="cms-dash-empty">No path data yet.</p>
      ) : (
        <ul className="cms-dash-lolli">
          {paths.map((p) => {
            const pct = Math.round((p.count / max) * 100);
            return (
              <li key={p.path} className="cms-dash-lolli__row">
                <span className="cms-dash-lolli__label" title={p.path}>
                  {p.label}
                </span>
                <div className="cms-dash-lolli__track">
                  <div
                    className="cms-dash-lolli__line"
                    style={{ width: `${pct}%` }}
                  />
                  <span
                    className="cms-dash-lolli__dot"
                    style={{ left: `${pct}%` }}
                  />
                </div>
                <span className="cms-dash-lolli__count">{p.count}</span>
              </li>
            );
          })}
        </ul>
      )}
      {total > 0 ? (
        <p className="cms-dash-card__foot">
          {total.toLocaleString()} total views in window
        </p>
      ) : null}
    </div>
  );
}

const localeColors = [
  "var(--cms-accent)",
  "color-mix(in srgb, var(--cms-accent) 70%, #1a1a1a)",
  "color-mix(in srgb, var(--cms-accent) 45%, #888)",
  "color-mix(in srgb, var(--cms-ink) 35%, transparent)",
  "color-mix(in srgb, var(--cms-ink) 18%, transparent)",
  "color-mix(in srgb, var(--cms-ink) 10%, transparent)",
];

/** Donut locale mix */
export function LocaleDonut({
  locales,
}: {
  locales: Array<{ locale: string; count: number }>;
}) {
  const total = locales.reduce((s, l) => s + l.count, 0);
  const data = locales.map((l, i) => ({
    name: l.locale.toUpperCase(),
    value: l.count,
    fill: localeColors[i % localeColors.length],
  }));

  const config = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: d.fill }])
  ) satisfies ChartConfig;

  return (
    <div className="cms-dash-card">
      <header className="cms-dash-card__head">
        <h3 className="cms-dash-card__title">Locale mix</h3>
        <span className="cms-dash-card__hint">Visits by language</span>
      </header>
      {total === 0 ? (
        <p className="cms-dash-empty">No locale data yet.</p>
      ) : (
        <div className="cms-dash-donut">
          <ChartContainer config={config} className="cms-dash-donut__chart">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                strokeWidth={2}
                stroke="var(--cms-bg-elevated)"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="cms-dash-donut__legend">
            {data.map((d) => (
              <li key={d.name}>
                <span
                  className="cms-dash-donut__swatch"
                  style={{ background: d.fill }}
                />
                <span>{d.name}</span>
                <strong>
                  {total ? Math.round((d.value / total) * 100) : 0}%
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Radial SVG gauge for AI tokens */
export function AiGaugeCard({
  tokens,
  calls,
  cost,
  limit,
  periodLabel,
}: {
  tokens: number;
  calls: number;
  cost: number;
  limit: number | null;
  periodLabel: string;
}) {
  const max = limit && limit > 0 ? limit : Math.max(tokens * 1.4, 1000);
  const pct = Math.min(100, Math.round((tokens / max) * 100));
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="cms-dash-card cms-dash-gauge">
      <header className="cms-dash-card__head">
        <h3 className="cms-dash-card__title">AI usage</h3>
        <span className="cms-dash-card__hint">{periodLabel}</span>
      </header>
      <div className="cms-dash-gauge__body">
        <svg viewBox="0 0 100 100" className="cms-dash-gauge__svg" aria-hidden>
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--cms-hover)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="var(--cms-accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
          />
          <text
            x="50"
            y="48"
            textAnchor="middle"
            className="cms-dash-gauge__num"
          >
            {formatTokens(tokens)}
          </text>
          <text
            x="50"
            y="60"
            textAnchor="middle"
            className="cms-dash-gauge__unit"
          >
            tokens
          </text>
        </svg>
        <div className="cms-dash-gauge__meta">
          <p>
            <strong>{calls}</strong> calls
          </p>
          <p>${cost.toFixed(4)} est.</p>
          {limit && limit > 0 ? <p>{pct}% of soft cap</p> : null}
        </div>
      </div>
    </div>
  );
}

/** Storage ring */
export function StorageRingCard({
  totalSize,
  totalFiles,
  limitBytes,
  ready,
}: {
  totalSize: number;
  totalFiles: number;
  limitBytes: number | null;
  ready: boolean;
}) {
  const max = limitBytes && limitBytes > 0 ? limitBytes : Math.max(totalSize * 2, 1);
  const pct = ready ? Math.min(100, Math.round((totalSize / max) * 100)) : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="cms-dash-card cms-dash-gauge">
      <header className="cms-dash-card__head">
        <h3 className="cms-dash-card__title">R2 storage</h3>
        <span className="cms-dash-card__hint">Cloudflare</span>
      </header>
      {!ready ? (
        <p className="cms-dash-empty">R2 not configured</p>
      ) : (
        <div className="cms-dash-gauge__body">
          <svg viewBox="0 0 100 100" className="cms-dash-gauge__svg" aria-hidden>
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="var(--cms-hover)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="color-mix(in srgb, var(--cms-accent) 55%, #8a5a2a)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="48"
              textAnchor="middle"
              className="cms-dash-gauge__num"
            >
              {formatBytes(totalSize)}
            </text>
            <text
              x="50"
              y="60"
              textAnchor="middle"
              className="cms-dash-gauge__unit"
            >
              used
            </text>
          </svg>
          <div className="cms-dash-gauge__meta">
            <p>
              <strong>{totalFiles.toLocaleString()}</strong> objects
            </p>
            {limitBytes ? <p>{pct}% of {formatBytes(limitBytes)}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}

/** Inquiry sparkline area */
export function InquirySparkCard({
  series,
  total,
  bySource,
}: {
  series: SeriesPoint[];
  total: number;
  bySource: Array<{ source: string; count: number }>;
}) {
  return (
    <div className="cms-dash-card">
      <header className="cms-dash-card__head">
        <h3 className="cms-dash-card__title">Inquiries</h3>
        <span className="cms-dash-card__hint">14 days</span>
      </header>
      <p className="cms-dash-big">
        {total}
        <span>leads</span>
      </p>
      <ChartContainer config={sparkConfig} className="cms-dash-spark">
        <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="inqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cms-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--cms-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="visitors"
            stroke="var(--cms-accent)"
            fill="url(#inqFill)"
            strokeWidth={1.75}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      {bySource.length > 0 ? (
        <ul className="cms-dash-sources">
          {bySource.slice(0, 3).map((s) => (
            <li key={s.source}>
              <span>{s.source}</span>
              <strong>{s.count}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cms-dash-empty cms-dash-empty--tight">No leads yet.</p>
      )}
    </div>
  );
}

/** Content pulse — big stats strip */
export function ContentPulse({
  published,
  draft,
  featured,
  news,
  skills,
}: {
  published: number;
  draft: number;
  featured: number;
  news: number;
  skills: number;
}) {
  const items = [
    { label: "Live projects", value: published },
    { label: "Drafts", value: draft },
    { label: "Featured", value: featured },
    { label: "News", value: news },
    { label: "Skills", value: skills },
  ];

  return (
    <div className="cms-dash-card cms-dash-pulse">
      <header className="cms-dash-card__head">
        <h3 className="cms-dash-card__title">Content pulse</h3>
        <span className="cms-dash-card__hint">Catalog</span>
      </header>
      <div className="cms-dash-pulse__grid">
        {items.map((item) => (
          <div key={item.label} className="cms-dash-pulse__cell">
            <span className="cms-dash-pulse__value">{item.value}</span>
            <span className="cms-dash-pulse__label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Service status as heatmap tiles */
export function StatusHeatmap({
  services,
}: {
  services: Array<{
    name: string;
    status: "online" | "offline" | "degraded";
    detail: string;
  }>;
}) {
  return (
    <div className="cms-dash-card">
      <header className="cms-dash-card__head">
        <h3 className="cms-dash-card__title">Service health</h3>
        <span className="cms-dash-card__hint">Live checks</span>
      </header>
      <div className="cms-dash-heat">
        {services.map((s) => (
          <div
            key={s.name}
            className={cn("cms-dash-heat__tile", `is-${s.status}`)}
            title={s.detail}
          >
            <span className="cms-dash-heat__dot" />
            <span className="cms-dash-heat__name">{s.name}</span>
            <span className="cms-dash-heat__status">{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i += 1;
  }
  const digits = i === 0 ? 0 : n < 10 ? 1 : 0;
  return `${n.toFixed(digits)} ${units[i]}`;
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}
