"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export type DashTraffic = {
  todayViews: number;
  todayVisitors: number;
  totalViews: number;
  totalVisitors: number;
  last7: Array<{ day: string; pageViews: number; visitors: number }>;
};

export type DashProjects = {
  total: number;
  published: number;
  featured: number;
};

type ServiceStatus = {
  id: string;
  name: string;
  status: "online" | "offline" | "degraded";
  ping: number;
  description: string;
};

type TableCount = {
  table: string;
  label: string;
  rows: number;
};

type StatusPayload = {
  summary: {
    total: number;
    online: number;
    degraded: number;
    offline: number;
    avgPing: number;
  };
  services: ServiceStatus[];
  tables: TableCount[];
  ai: { provider: string; model: string; configured: boolean };
  checkedAt: string;
};

function weekday(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function StatusDot({ status }: { status: ServiceStatus["status"] }) {
  return (
    <span className={`cms-status-dot is-${status}`} aria-hidden>
      {status === "online" ? <span className="cms-status-ping" /> : null}
      <span className="cms-status-core" />
    </span>
  );
}

export function CmsDashboard({
  traffic,
  projects,
}: {
  traffic: DashTraffic;
  projects: DashProjects;
}) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbOpen, setDbOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/status", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load system status");
      const data = (await res.json()) as StatusPayload;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const maxVisitors = Math.max(...traffic.last7.map((d) => d.visitors), 1);
  const weekVisitors = traffic.last7.reduce((s, d) => s + d.visitors, 0);
  const weekViews = traffic.last7.reduce((s, d) => s + d.pageViews, 0);

  return (
    <div className="cms-dash">
      <section className="cms-dash-panel">
        <div className="cms-dash-panel-head">
          <div>
            <p className="cms-dash-kicker">Traffic</p>
            <h2 className="cms-dash-heading">Who visited the site</h2>
          </div>
          <Link href="/" className="cms-btn cms-btn-ghost" target="_blank">
            View site
          </Link>
        </div>

        <div className="cms-dash-metrics">
          <article className="cms-dash-metric">
            <p className="cms-dash-metric-label">Today · visitors</p>
            <p className="cms-dash-metric-value">{traffic.todayVisitors}</p>
            <p className="cms-dash-metric-meta">{traffic.todayViews} page views</p>
          </article>
          <article className="cms-dash-metric">
            <p className="cms-dash-metric-label">Last 7 days</p>
            <p className="cms-dash-metric-value">{weekVisitors}</p>
            <p className="cms-dash-metric-meta">{weekViews} page views</p>
          </article>
          <article className="cms-dash-metric">
            <p className="cms-dash-metric-label">All time · visitors</p>
            <p className="cms-dash-metric-value">{traffic.totalVisitors}</p>
            <p className="cms-dash-metric-meta">{traffic.totalViews} page views</p>
          </article>
          <article className="cms-dash-metric">
            <p className="cms-dash-metric-label">Projects live</p>
            <p className="cms-dash-metric-value">{projects.published}</p>
            <p className="cms-dash-metric-meta">
              {projects.featured} featured · {projects.total} total
            </p>
          </article>
        </div>

        <div className="cms-dash-chart" role="img" aria-label="Visitors last 7 days">
          {traffic.last7.map((d) => {
            const h = Math.round(12 + (d.visitors / maxVisitors) * 88);
            return (
              <div key={d.day} className="cms-dash-bar-col">
                <span className="cms-dash-bar-val">{d.visitors}</span>
                <span className="cms-dash-bar" style={{ height: `${h}%` }} />
                <span className="cms-dash-bar-label">{weekday(d.day)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="cms-dash-panel">
        <div className="cms-dash-panel-head">
          <div>
            <p className="cms-dash-kicker">System</p>
            <h2 className="cms-dash-heading">Status · AI · Database</h2>
          </div>
          <button
            type="button"
            className="cms-btn cms-btn-ghost"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? "Checking…" : "Refresh"}
          </button>
        </div>

        {error ? <p className="cms-dash-error">{error}</p> : null}

        {status ? (
          <div className="cms-dash-summary">
            <span>
              <strong>{status.summary.online}</strong> online
            </span>
            <span>
              <strong>{status.summary.degraded}</strong> degraded
            </span>
            <span>
              <strong>{status.summary.offline}</strong> offline
            </span>
            <span>
              avg <strong>{status.summary.avgPing || "—"}</strong> ms
            </span>
          </div>
        ) : null}

        <div className="cms-status-list">
          {(status?.services ?? []).map((service) => {
            const isDb = service.id === "database";
            const open = isDb && dbOpen;
            const body = (
              <>
                <div className="cms-status-left">
                  <StatusDot status={service.status} />
                  <div>
                    <p className="cms-status-name">
                      {service.name}
                      {isDb ? (
                        <span className="cms-status-hint">{open ? "Hide" : "View tables"}</span>
                      ) : null}
                    </p>
                    <p className="cms-status-desc">{service.description}</p>
                  </div>
                </div>
                <div className="cms-status-right">
                  {service.ping > 0 ? (
                    <span className="cms-status-ping-ms">{service.ping}ms</span>
                  ) : null}
                  <span className={`cms-status-label is-${service.status}`}>
                    {service.status}
                  </span>
                </div>
              </>
            );
            return (
              <div key={service.id} className="cms-status-block">
                {isDb ? (
                  <button
                    type="button"
                    className={`cms-status-card is-clickable${open ? " is-open" : ""}`}
                    onClick={() => setDbOpen((v) => !v)}
                    aria-expanded={open}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="cms-status-card">{body}</div>
                )}

                {isDb && open ? (
                  <div className="cms-db-panel">
                    <p className="cms-db-lead">Postgres tables · row counts</p>
                    <ul className="cms-db-table">
                      {(status?.tables ?? []).map((t) => (
                        <li key={t.table}>
                          <code>{t.table}</code>
                          <span className="cms-db-label">{t.label}</span>
                          <strong>{t.rows}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}

          {!status && loading ? (
            <p className="cms-dash-loading">Checking services…</p>
          ) : null}
        </div>

        {status?.ai ? (
          <div className="cms-ai-chip">
            <span className="cms-ai-chip-dot" aria-hidden />
            <div>
              <p className="cms-ai-chip-label">Active chat model</p>
              <p className="cms-ai-chip-value">
                {status.ai.provider} · <code>{status.ai.model}</code>
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
