"use client";

import SiriOrb from "@/components/ai/SiriOrb";
import {
  accentForModel,
  shortModelName,
  variantForModel,
  type OrbVariant,
} from "@/lib/llm-models";
import { cn } from "cn";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";

export type AiUsageModelRow = {
  model: string;
  calls: number;
  tokens: number;
  cost: number;
  avgLatency?: number;
};

export type AiUsageDayRow = {
  date: string;
  day: string;
  total: number;
  byModel: Record<string, number>;
};

export type AiUsageReportProps = {
  summary: {
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    avgLatency?: number;
    change?: {
      tokens: number | null;
      calls: number | null;
      cost: number | null;
    };
    previous?: {
      tokens: number;
      calls: number;
      cost: number;
    };
  };
  usageByModel: AiUsageModelRow[];
  usageByDay?: AiUsageDayRow[];
  tokenLimit?: number | null;
  periodLabel?: string;
  className?: string;
  /** Compact card for dashboard bento */
  compact?: boolean;
};

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function niceCeil(n: number) {
  if (n <= 0) return 100;
  const exp = Math.floor(Math.log10(n));
  const base = 10 ** exp;
  const scaled = n / base;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * base;
}

function ChangePill({ value }: { value: number | null | undefined }) {
  if (value == null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span className={cn("cms-ai-report__change", up ? "is-up" : "is-down")}>
      {up ? (
        <TrendingUp className="size-3" aria-hidden />
      ) : (
        <TrendingDown className="size-3" aria-hidden />
      )}
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

export function AiUsageReport({
  summary,
  usageByModel,
  usageByDay = [],
  tokenLimit = null,
  periodLabel = "30 days",
  className,
  compact = false,
}: AiUsageReportProps) {
  const models = [...usageByModel]
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, compact ? 5 : 12);
  const totalTokens = summary.totalTokens || 0;
  const totalCalls = summary.totalCalls || 0;
  const limit = tokenLimit && tokenLimit > 0 ? tokenLimit : null;
  const overallPct = limit
    ? Math.min(100, Math.round((totalTokens / limit) * 1000) / 10)
    : null;

  const modelMeta = models.map((m, i) => ({
    ...m,
    color: accentForModel(m.model, i),
    variant: variantForModel(m.model) as OrbVariant,
    label: shortModelName(m.model),
    tokenPct: totalTokens > 0 ? (m.tokens / totalTokens) * 100 : 0,
    callPct: totalCalls > 0 ? (m.calls / totalCalls) * 100 : 0,
  }));

  const days =
    usageByDay.length > 0
      ? usageByDay
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - (6 - i));
          return {
            date: d.toISOString().slice(0, 10),
            day: d.toLocaleDateString("en-US", { weekday: "short" }),
            total: 0,
            byModel: {} as Record<string, number>,
          };
        });

  const maxDay = Math.max(...days.map((d) => d.total), 0);
  const dailySoftCap = limit ? Math.max(1, Math.round(limit / 30)) : null;
  const scaleMax = niceCeil(Math.max(maxDay, dailySoftCap || 0, 100));
  const yTicks = [1, 0.8, 0.6, 0.4, 0.2, 0].map((f) => Math.round(scaleMax * f));
  const limitPctOnScale = dailySoftCap
    ? Math.min(100, (dailySoftCap / scaleMax) * 100)
    : null;

  const topVariant = modelMeta[0]?.variant ?? "violet";

  return (
    <section
      className={cn(
        "cms-ai-report",
        compact && "cms-ai-report--compact",
        className
      )}
    >
      <header className="cms-ai-report__head">
        <div className="cms-ai-report__title-row">
          <div className="cms-ai-report__orb" aria-hidden>
            <SiriOrb size={compact ? 28 : 36} variant={topVariant} />
          </div>
          <div>
            <h2 className="cms-ai-report__title">AI Model Usage</h2>
            <p className="cms-ai-report__sub">
              {periodLabel}
              {overallPct != null ? ` · ${overallPct}% of monthly cap` : ""}
            </p>
          </div>
        </div>
        <span className="cms-ai-report__spark" aria-hidden>
          <Sparkles className="size-4" />
        </span>
      </header>

      <div className="cms-ai-report__kpis">
        <div className="cms-ai-report__kpi">
          <span className="cms-ai-report__kpi-label">Tokens</span>
          <div className="cms-ai-report__kpi-value">
            <strong>{formatTokens(totalTokens)}</strong>
            <ChangePill value={summary.change?.tokens} />
          </div>
          <p className="cms-ai-report__kpi-hint">
            {limit
              ? `Cap ${formatTokens(limit)}`
              : summary.previous
                ? `vs ${formatTokens(summary.previous.tokens)} prior`
                : "All models"}
          </p>
        </div>
        <div className="cms-ai-report__kpi">
          <span className="cms-ai-report__kpi-label">Calls</span>
          <div className="cms-ai-report__kpi-value">
            <strong>{totalCalls.toLocaleString()}</strong>
            <ChangePill value={summary.change?.calls} />
          </div>
          <p className="cms-ai-report__kpi-hint">
            {summary.previous
              ? `vs ${summary.previous.calls.toLocaleString()} prior`
              : "Requests"}
          </p>
        </div>
        <div className="cms-ai-report__kpi">
          <span className="cms-ai-report__kpi-label">Est. cost</span>
          <div className="cms-ai-report__kpi-value">
            <strong>${summary.totalCost.toFixed(4)}</strong>
            <ChangePill value={summary.change?.cost} />
          </div>
          <p className="cms-ai-report__kpi-hint">
            {summary.avgLatency != null
              ? `Avg ${summary.avgLatency}ms`
              : "USD"}
          </p>
        </div>
      </div>

      {/* Overall mix vs limit */}
      <div className="cms-ai-report__overall">
        <div className="cms-ai-report__overall-meta">
          <span>Overall mix</span>
          <span>
            {overallPct != null
              ? `${overallPct}% of limit`
              : `${modelMeta.length} models`}
          </span>
        </div>
        <div
          className="cms-ai-report__track"
          role="img"
          aria-label="Overall model token mix"
        >
          <div
            className="cms-ai-report__stack"
            style={{
              width: limit
                ? `${Math.max(overallPct ?? 0, totalTokens > 0 ? 2 : 0)}%`
                : "100%",
            }}
          >
            {modelMeta.map((m) => (
              <div
                key={m.model}
                className="cms-ai-report__seg"
                style={{
                  width: `${Math.max(m.tokenPct, totalTokens > 0 ? 1.2 : 0)}%`,
                  background: m.color,
                }}
                title={`${m.label} · ${m.tokenPct.toFixed(1)}%`}
              />
            ))}
          </div>
          {limit && overallPct != null ? (
            <span
              className="cms-ai-report__limit"
              style={{ left: "100%" }}
              title={`Monthly limit · ${formatTokens(limit)}`}
            />
          ) : null}
        </div>
      </div>

      {/* Daily stacked bars */}
      {!compact ? (
        <div className="cms-ai-report__chart">
          <div className="cms-ai-report__y" aria-hidden>
            {yTicks.map((t) => (
              <span key={t}>{formatTokens(t)}</span>
            ))}
          </div>
          <div className="cms-ai-report__bars">
            {days.map((d) => {
              const fillPct = scaleMax > 0 ? (d.total / scaleMax) * 100 : 0;
              const segs = modelMeta
                .map((m) => ({
                  model: m.model,
                  color: m.color,
                  label: m.label,
                  tokens: d.byModel[m.model] || 0,
                }))
                .filter((s) => s.tokens > 0);
              // Include any day-only models not in period totals
              for (const [mid, tok] of Object.entries(d.byModel)) {
                if (tok > 0 && !segs.some((s) => s.model === mid)) {
                  segs.push({
                    model: mid,
                    color: accentForModel(mid),
                    label: shortModelName(mid),
                    tokens: tok,
                  });
                }
              }
              return (
                <div key={d.date} className="cms-ai-report__bar-col">
                  <div className="cms-ai-report__bar-track">
                    <div
                      className="cms-ai-report__bar-fill"
                      style={{ width: `${Math.max(fillPct, d.total > 0 ? 1 : 0)}%` }}
                    >
                      {segs.map((s) => (
                        <div
                          key={s.model}
                          className="cms-ai-report__seg"
                          style={{
                            width: `${d.total > 0 ? (s.tokens / d.total) * 100 : 0}%`,
                            background: s.color,
                          }}
                          title={`${s.label} · ${formatTokens(s.tokens)}`}
                        />
                      ))}
                    </div>
                    {limitPctOnScale != null ? (
                      <span
                        className="cms-ai-report__limit"
                        style={{ left: `${limitPctOnScale}%` }}
                        title={`Soft daily · ${formatTokens(dailySoftCap!)}`}
                      />
                    ) : null}
                  </div>
                  <span className="cms-ai-report__x">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Model detail */}
      <div className="cms-ai-report__detail">
        <div className="cms-ai-report__cols">
          <span>Model</span>
          <span>Calls</span>
          <span>Tokens</span>
          <span>Cost</span>
          <span>Share</span>
        </div>
        {modelMeta.length === 0 ? (
          <p className="cms-ai-report__empty">No model usage in this window.</p>
        ) : (
          <ul>
            {modelMeta.map((m) => (
              <li key={m.model}>
                <div className="cms-ai-report__model">
                  <span className="cms-ai-report__model-orb" aria-hidden>
                    <SiriOrb size={compact ? 18 : 22} variant={m.variant} />
                  </span>
                  <span
                    className="cms-ai-report__swatch"
                    style={{ background: m.color }}
                    aria-hidden
                  />
                  <span className="cms-ai-report__model-name" title={m.model}>
                    {m.label}
                  </span>
                </div>
                <span className="cms-ai-report__num">{m.calls.toLocaleString()}</span>
                <span className="cms-ai-report__num">{formatTokens(m.tokens)}</span>
                <span className="cms-ai-report__num">${m.cost.toFixed(4)}</span>
                <strong className="cms-ai-report__num">{m.tokenPct.toFixed(0)}%</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
