"use client";

import { AiUsageReport } from "@/components/management/ai-usage-report";
import { SystemAiUsageGrid } from "@/components/management/system-ai-usage-grid";
import { SystemAuditGrid } from "@/components/management/system-audit-grid";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "cn";
import {
  Brain,
  Loader2,
  RefreshCw,
  ScrollText,
  Shield,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Tab = "log" | "usage" | "audit";

function tabFromParam(value: string | null): Tab {
  if (value === "usage" || value === "audit" || value === "log") return value;
  return "log";
}

type AIUsageLog = {
  id: string;
  provider: string;
  model: string;
  status: string;
  totalTokens?: number | null;
  cost?: number | null;
  latency: number;
  projectSlug?: string | null;
  route?: string | null;
  contentFields?: string | null;
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
  createdAt: string;
};

type UsageStats = {
  summary: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalTokens: number;
    totalCost: number;
    avgLatency: number;
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
  usageByModel: Array<{
    model: string;
    calls: number;
    tokens: number;
    cost: number;
    avgLatency: number;
  }>;
  usageByDay?: Array<{
    date: string;
    day: string;
    total: number;
    byModel: Record<string, number>;
  }>;
  recentLogs: AIUsageLog[];
  tokenLimit?: number | null;
};

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  path: string;
  createdAt: string;
};

export function AiOpsPanel() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    tabFromParam(searchParams.get("tab"))
  );
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAi = useCallback(async () => {
    // Lazy retention cleanup for both log types (settings live in Web settings)
    void fetchJson("/api/cms/log-retention");
    const { ok, data } = await fetchJson<{
      success?: boolean;
      data?: UsageStats;
    }>("/api/ai/stats");
    if (ok && data.data) setStats(data.data);
  }, []);

  const loadAudit = useCallback(async () => {
    void fetchJson("/api/cms/log-retention");
    const { ok, data } = await fetchJson<{
      success?: boolean;
      data?: { logs?: AuditLog[] };
    }>("/api/audit?limit=100");
    if (ok) setAuditLogs(data.data?.logs || []);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "audit") await loadAudit();
      else await loadAi();
    } finally {
      setLoading(false);
    }
  }, [tab, loadAi, loadAudit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function deleteAiLogs(ids: string[]) {
    const { ok } = await fetchJson("/api/ai/logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (ok) await loadAi();
  }

  async function deleteAuditLogs(ids: string[]) {
    const { ok } = await fetchJson("/api/audit", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (ok) await loadAudit();
  }

  const tabs: { id: Tab; label: string; icon: typeof Brain }[] = [
    { id: "log", label: "AI log", icon: ScrollText },
    { id: "usage", label: "AI usage", icon: Brain },
    { id: "audit", label: "Audit", icon: Shield },
  ];

  return (
    <div className="cms-system">
      <header className="cms-system__head">
        <div>
          <p className="cms-eyebrow">AI</p>
          <h1 className="cms-title">AI usage &amp; logs</h1>
          <p className="cms-subtitle">
            Model mix, token spend, and log history. Auto-delete lives in
            profile → Settings → Web.
          </p>
        </div>
        <button
          type="button"
          className="cms-btn cms-btn--ghost"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Reload
        </button>
      </header>

      <div className="cms-system__tabs" role="tablist">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={cn("cms-system__tab", tab === t.id && "is-active")}
              onClick={() => setTab(t.id)}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "usage" ? (
        <div className="cms-system__panel">
          {loading && !stats ? (
            <div className="cms-system__empty">
              <Loader2 className="size-8 animate-spin opacity-40" />
            </div>
          ) : !stats || stats.summary.totalCalls === 0 ? (
            <div className="cms-system__empty">
              <Brain className="size-10 opacity-35" />
              <p>No AI usage yet — translate a project to see metrics.</p>
            </div>
          ) : (
            <AiUsageReport
              summary={stats.summary}
              usageByModel={stats.usageByModel}
              usageByDay={stats.usageByDay}
              tokenLimit={stats.tokenLimit}
              periodLabel="Last 30 days"
            />
          )}
        </div>
      ) : null}

      {tab === "log" ? (
        <div className="cms-system__panel">
          {loading && !stats ? (
            <div className="cms-system__empty">
              <Loader2 className="size-8 animate-spin opacity-40" />
            </div>
          ) : !stats || stats.recentLogs.length === 0 ? (
            <div className="cms-system__empty">
              <ScrollText className="size-10 opacity-35" />
              <p>No AI log rows in the current window.</p>
            </div>
          ) : (
            <div className="cms-system__grid-block">
              <div className="cms-system__grid-head">
                <h2>Recent AI logs</h2>
                <p>
                  {stats.recentLogs.length} records · checkbox or right-click to
                  delete
                </p>
              </div>
              <SystemAiUsageGrid
                rows={stats.recentLogs}
                onDeleteIds={deleteAiLogs}
              />
            </div>
          )}
        </div>
      ) : null}

      {tab === "audit" ? (
        <div className="cms-system__panel">
          {loading && auditLogs.length === 0 ? (
            <div className="cms-system__empty">
              <Loader2 className="size-8 animate-spin opacity-40" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="cms-system__empty">
              <Shield className="size-10 opacity-35" />
              <p>No audit events yet.</p>
            </div>
          ) : (
            <div className="cms-system__grid-block">
              <div className="cms-system__grid-head">
                <h2>Audit log</h2>
                <p>
                  {auditLogs.length} events · checkbox or right-click to delete
                </p>
              </div>
              <SystemAuditGrid
                rows={auditLogs}
                onDeleteIds={deleteAuditLogs}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
