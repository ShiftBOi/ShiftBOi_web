"use client";

import {
  OverviewDashboard,
  type OverviewData,
} from "@/components/management/overview-dashboard";
import { useEffect, useState } from "react";

export function OverviewDashboardClient({
  user,
  initial,
}: {
  user: { username: string; email: string };
  initial: OverviewData;
}) {
  const [overview, setOverview] = useState(initial);

  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const [countsRes, statusRes, storageRes] = await Promise.all([
          fetch("/api/cms/overview"),
          fetch("/api/cms/status"),
          fetch("/api/cms/storage?mode=summary"),
        ]);
        const counts = await countsRes.json().catch(() => ({}));
        const status = await statusRes.json().catch(() => ({}));
        const storageJson = await storageRes.json().catch(() => null);
        if (!alive) return;

        const summary = counts?.ai;
        const storagePayload = storageJson?.data ?? storageJson;
        const storageOk = storageRes.ok && Boolean(storagePayload);
        const storageUnavailable = storageRes.status === 503;
        const trafficData = counts?.traffic ?? null;
        const trafficOk = Boolean(trafficData);

        setOverview((prev) => ({
          counts: {
            ...prev.counts,
            ...(counts.counts ?? {}),
          },
          recentInquiries: counts.recentInquiries ?? prev.recentInquiries,
          inquiriesPulse: counts.inquiriesPulse ?? prev.inquiriesPulse,
          services: (status.services || []).map(
            (s: {
              name: string;
              status: string;
              detail?: string;
              description?: string;
              ping?: number;
            }) => ({
              name: s.name,
              status: s.status as "online" | "offline" | "degraded",
              detail:
                s.detail ||
                s.description ||
                (s.ping ? `${s.ping}ms` : ""),
            }),
          ),
          ai: summary
            ? {
                totalCalls: summary.totalCalls || 0,
                totalTokens: summary.totalTokens || 0,
                totalCost: summary.totalCost || 0,
                avgLatency: summary.avgLatency || 0,
                periodLabel: summary.periodLabel || "30 days",
                tokenLimit:
                  typeof summary.tokenLimit === "number"
                    ? summary.tokenLimit
                    : null,
                usageByModel: Array.isArray(summary.usageByModel)
                  ? summary.usageByModel
                  : [],
                change: summary.change,
                previous: summary.previous,
              }
            : prev.ai,
          storage: storageUnavailable
            ? {
                totalFiles: 0,
                totalSize: 0,
                ready: false,
                limitBytes: null,
                limitLabel: null,
              }
            : storageOk
              ? {
                  totalFiles: storagePayload?.totalFiles || 0,
                  totalSize: storagePayload?.totalSize || 0,
                  ready: storagePayload?.storage === "r2" || Boolean(storagePayload),
                  limitBytes:
                    typeof storagePayload?.limitBytes === "number"
                      ? storagePayload.limitBytes
                      : null,
                  limitLabel:
                    typeof storagePayload?.limitLabel === "string"
                      ? storagePayload.limitLabel
                      : null,
                }
              : prev.storage,
          traffic: trafficOk
            ? {
                series: trafficData?.series || [],
                total: trafficData?.total || 0,
                changePct:
                  typeof trafficData?.changePct === "number"
                    ? trafficData.changePct
                    : null,
                paths: trafficData?.paths || [],
                locales: trafficData?.locales || [],
                peak: trafficData?.peak ?? null,
              }
            : prev.traffic ?? {
                series: [],
                total: 0,
                changePct: null,
                paths: [],
                locales: [],
                peak: null,
              },
        }));
      } catch {
        setOverview((prev) =>
          prev.traffic
            ? prev
            : {
                ...prev,
                traffic: {
                  series: [],
                  total: 0,
                  changePct: null,
                  paths: [],
                  locales: [],
                  peak: null,
                },
              },
        );
      }
    }
    void refresh();
    const id = window.setInterval(() => void refresh(), 15000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  return <OverviewDashboard user={user} overview={overview} />;
}
