"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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

type RecentProject = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  featured: boolean;
  visibility: "PUBLIC" | "CONFIDENTIAL";
  year: string | null;
  updatedAt: string;
  coverImage: string | null;
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
  content: {
    total: number;
    published: number;
    drafts: number;
    featured: number;
    confidential: number;
    gaps: { missingCover: number; missingIntro: number };
    recent: RecentProject[];
  } | null;
  traffic: {
    todayViews: number;
    todayVisitors: number;
    totalViews: number;
    totalVisitors: number;
    last7: Array<{ day: string; pageViews: number; visitors: number }>;
  } | null;
  ai: { provider: string; model: string; configured: boolean };
  checkedAt: string;
};

function StatusDot({ status }: { status: ServiceStatus["status"] }) {
  return (
    <span className={`cms-status-dot is-${status}`} aria-hidden>
      {status === "online" ? <span className="cms-status-ping" /> : null}
      <span className="cms-status-core" />
    </span>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function SparkBars({
  values,
}: {
  values: Array<{ day: string; pageViews: number }>;
}) {
  const max = Math.max(1, ...values.map((v) => v.pageViews));
  return (
    <div className="cms-dash-spark" aria-hidden>
      {values.map((v) => {
        const weekday = new Date(`${v.day}T12:00:00Z`).toLocaleDateString(
          undefined,
          { weekday: "narrow", timeZone: "UTC" },
        );
        return (
          <span key={v.day} className="cms-dash-spark-col">
            <span
              className="cms-dash-spark-bar"
              style={{ height: `${Math.max(10, (v.pageViews / max) * 100)}%` }}
              title={`${v.day}: ${v.pageViews}`}
            />
            <span className="cms-dash-spark-label">{weekday}</span>
          </span>
        );
      })}
    </div>
  );
}

export function CmsDashboard() {
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

  const content = status?.content;
  const traffic = status?.traffic;
  const weekViews = traffic?.last7.reduce((a, d) => a + d.pageViews, 0) ?? 0;
  const weekVisitors =
    traffic?.last7.reduce((a, d) => a + d.visitors, 0) ?? 0;
  const peakDay =
    traffic && traffic.last7.length > 0
      ? traffic.last7.reduce((best, d) =>
          d.pageViews > best.pageViews ? d : best,
        )
      : undefined;
  const avgDayViews = traffic ? Math.round(weekViews / 7) : 0;
  const viewsPerVisitor =
    weekVisitors > 0 ? (weekViews / weekVisitors).toFixed(1) : "—";
  const peakLabel = peakDay?.day
    ? new Date(`${peakDay.day}T12:00:00Z`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })
    : "—";

  return (
    <div className="cms-dash">
      <div className="cms-dash-grid">
        <section className="cms-dash-panel">
          <div className="cms-dash-panel-head">
            <div>
              <p className="cms-dash-kicker">Content</p>
              <h2 className="cms-dash-heading">Recent projects</h2>
            </div>
            <Link href="/cms/projects" className="cms-dash-panel-link">
              All projects
            </Link>
          </div>

          <ul className="cms-dash-recent">
            {(content?.recent ?? []).map((p) => (
              <li key={p.id}>
                <Link href={`/cms/projects/${p.id}`} className="cms-dash-recent-row">
                  <span
                    className="cms-dash-recent-thumb"
                    style={
                      p.coverImage
                        ? { backgroundImage: `url(${p.coverImage})` }
                        : undefined
                    }
                    aria-hidden
                  />
                  <span className="cms-dash-recent-copy">
                    <span className="cms-dash-recent-title">{p.title}</span>
                    <span className="cms-dash-recent-meta">
                      {p.year ? `${p.year} · ` : ""}
                      {relativeTime(p.updatedAt)}
                    </span>
                  </span>
                  <span className="cms-dash-recent-flags">
                    {p.featured ? <span className="cms-dash-flag">Featured</span> : null}
                    <span
                      className={`cms-dash-flag is-${p.published ? "live" : "draft"}`}
                    >
                      {p.published ? "Live" : "Draft"}
                    </span>
                    {p.visibility === "CONFIDENTIAL" ? (
                      <span className="cms-dash-flag is-soft">Private</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
            {!loading && (!content?.recent || content.recent.length === 0) ? (
              <li className="cms-dash-empty">No projects yet — create one to get started.</li>
            ) : null}
            {loading && !content ? (
              <li className="cms-dash-empty">Loading recent edits…</li>
            ) : null}
          </ul>

          {content && (content.gaps.missingCover > 0 || content.gaps.missingIntro > 0) ? (
            <div className="cms-dash-gaps">
              <p className="cms-dash-gaps-label">Coverage gaps</p>
              <div className="cms-dash-gaps-row">
                {content.gaps.missingCover > 0 ? (
                  <span>
                    <strong>{content.gaps.missingCover}</strong> missing cover
                  </span>
                ) : null}
                {content.gaps.missingIntro > 0 ? (
                  <span>
                    <strong>{content.gaps.missingIntro}</strong> missing intro media
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>

        <section className="cms-dash-panel cms-dash-panel-traffic">
          <div className="cms-dash-panel-head">
            <div>
              <p className="cms-dash-kicker">Audience</p>
              <h2 className="cms-dash-heading">Site traffic</h2>
            </div>
            {traffic ? (
              <span className="cms-dash-panel-meta">Last 7 days</span>
            ) : null}
          </div>

          {traffic?.last7 ? <SparkBars values={traffic.last7} /> : null}

          <div className="cms-dash-traffic">
            <div className="cms-dash-traffic-stat">
              <p className="cms-dash-metric-label">Today</p>
              <p className="cms-dash-metric-value cms-dash-metric-value-sm">
                {traffic?.todayViews ?? (loading ? "—" : 0)}
              </p>
              <p className="cms-dash-metric-meta">
                {traffic?.todayVisitors ?? 0} visitors
              </p>
            </div>
            <div className="cms-dash-traffic-stat">
              <p className="cms-dash-metric-label">This week</p>
              <p className="cms-dash-metric-value cms-dash-metric-value-sm">
                {loading && !traffic ? "—" : weekViews}
              </p>
              <p className="cms-dash-metric-meta">{weekVisitors} visitors</p>
            </div>
            <div className="cms-dash-traffic-stat">
              <p className="cms-dash-metric-label">All-time</p>
              <p className="cms-dash-metric-value cms-dash-metric-value-sm">
                {traffic?.totalViews ?? (loading ? "—" : 0)}
              </p>
              <p className="cms-dash-metric-meta">
                {traffic?.totalVisitors ?? 0} visitors
              </p>
            </div>
          </div>

          <ul className="cms-dash-traffic-days">
            {(traffic?.last7 ?? []).map((d) => {
              const label = new Date(`${d.day}T12:00:00Z`).toLocaleDateString(
                undefined,
                { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" },
              );
              const isPeak = peakDay && d.day === peakDay.day && peakDay.pageViews > 0;
              return (
                <li key={d.day} className={isPeak ? "is-peak" : undefined}>
                  <span className="cms-dash-traffic-day-name">{label}</span>
                  <span className="cms-dash-traffic-day-meta">
                    {d.visitors} visitors
                  </span>
                  <strong>{d.pageViews}</strong>
                </li>
              );
            })}
            {!traffic && loading ? (
              <li className="cms-dash-empty">Loading traffic…</li>
            ) : null}
          </ul>

          <div className="cms-dash-traffic-insights">
            <div>
              <p className="cms-dash-metric-label">Peak day</p>
              <p className="cms-dash-traffic-insight-value">
                {peakLabel}
                {peakDay && peakDay.pageViews > 0 ? (
                  <span> · {peakDay.pageViews} views</span>
                ) : null}
              </p>
            </div>
            <div>
              <p className="cms-dash-metric-label">Avg / day</p>
              <p className="cms-dash-traffic-insight-value">{avgDayViews} views</p>
            </div>
            <div>
              <p className="cms-dash-metric-label">Views / visitor</p>
              <p className="cms-dash-traffic-insight-value">{viewsPerVisitor}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="cms-dash-panel">
        <div className="cms-dash-panel-head">
          <div>
            <p className="cms-dash-kicker">System</p>
            <h2 className="cms-dash-heading">Status · AI · Database</h2>
          </div>
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
        </div>

        {error ? <p className="cms-dash-error">{error}</p> : null}

        <ul className="cms-sys-list">
          {(status?.services ?? []).map((service) => {
            const isDb = service.id === "database";
            const open = isDb && dbOpen;
            const row = (
              <>
                <StatusDot status={service.status} />
                <span className="cms-sys-main">
                  <span className="cms-sys-name">
                    {service.name}
                    {isDb ? (
                      <span className="cms-sys-hint">{open ? "Hide" : "Tables"}</span>
                    ) : null}
                  </span>
                  <span className="cms-sys-desc">{service.description}</span>
                </span>
                <span className="cms-sys-meta">
                  {service.ping > 0 ? (
                    <span className="cms-sys-ping">{service.ping}ms</span>
                  ) : (
                    <span className="cms-sys-ping is-empty">—</span>
                  )}
                  <span className={`cms-sys-state is-${service.status}`}>
                    {service.status}
                  </span>
                </span>
              </>
            );
            return (
              <li
                key={service.id}
                className={`cms-sys-item${open ? " is-expanded" : ""}`}
              >
                {isDb ? (
                  <button
                    type="button"
                    className={`cms-sys-row is-clickable${open ? " is-open" : ""}`}
                    onClick={() => setDbOpen((v) => !v)}
                    aria-expanded={open}
                  >
                    {row}
                  </button>
                ) : (
                  <div className="cms-sys-row">{row}</div>
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
              </li>
            );
          })}

          {!status && loading ? (
            <li className="cms-dash-loading">Checking services…</li>
          ) : null}
        </ul>

        {status?.ai ? (
          <div className="cms-ai-chip">
            <span className="cms-ai-chip-dot" aria-hidden />
            <div>
              <p className="cms-ai-chip-label">Active chat model</p>
              <p className="cms-ai-chip-value">
                {status.ai.provider} · <code>{status.ai.model}</code>
              </p>
            </div>
            {status.checkedAt ? (
              <span className="cms-ai-chip-meta">
                Checked {new Date(status.checkedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
