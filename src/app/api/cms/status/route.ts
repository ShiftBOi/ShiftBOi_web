import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";
import {
  getCmsAiProviderInfo,
  isGeminiConfigured,
  usesGroq,
} from "@/lib/cms-ai";
import { isR2Configured, r2Client, R2_BUCKET } from "@/lib/r2";
import { getTrafficSummary } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ServiceStatus = {
  id: string;
  name: string;
  status: "online" | "offline" | "degraded";
  ping: number;
  description: string;
};

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAllowedAdminEmail(session.user.email)) return null;
  return session;
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      id: "database",
      name: "Database",
      status: "online",
      ping: Date.now() - start,
      description: "PostgreSQL",
    };
  } catch {
    return {
      id: "database",
      name: "Database",
      status: "offline",
      ping: 0,
      description: "PostgreSQL",
    };
  }
}

async function checkR2(): Promise<ServiceStatus> {
  const start = Date.now();
  if (!isR2Configured()) {
    return {
      id: "r2",
      name: "Media storage",
      status: "online",
      ping: 0,
      description: "Local · public/uploads (R2 not set)",
    };
  }
  try {
    await r2Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
    return {
      id: "r2",
      name: "Cloudflare R2",
      status: "online",
      ping: Date.now() - start,
      description: `Bucket · ${R2_BUCKET}`,
    };
  } catch {
    return {
      id: "r2",
      name: "Cloudflare R2",
      status: "offline",
      ping: 0,
      description: `Bucket · ${R2_BUCKET}`,
    };
  }
}

async function checkChatAi(): Promise<ServiceStatus> {
  const info = getCmsAiProviderInfo();
  const start = Date.now();

  if (usesGroq()) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      return {
        id: "chat-ai",
        name: "Chat AI",
        status: res.ok ? "online" : "degraded",
        ping: Date.now() - start,
        description: `${info.provider} · ${info.model}`,
      };
    } catch {
      return {
        id: "chat-ai",
        name: "Chat AI",
        status: "offline",
        ping: 0,
        description: `${info.provider} · ${info.model}`,
      };
    }
  }

  const base = (process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1").replace(
    /\/v1\/?$/,
    "",
  );
  try {
    const res = await fetch(`${base}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return {
      id: "chat-ai",
      name: "Chat AI",
      status: res.ok ? "online" : "degraded",
      ping: Date.now() - start,
      description: `${info.provider} · ${info.model}`,
    };
  } catch {
    return {
      id: "chat-ai",
      name: "Chat AI",
      status: "offline",
      ping: 0,
      description: `${info.provider} · ${info.model}`,
    };
  }
}

function checkGemini(): ServiceStatus {
  return {
    id: "gemini",
    name: "Gemini Embeddings",
    status: isGeminiConfigured() ? "online" : "degraded",
    ping: 0,
    description: isGeminiConfigured()
      ? "gemini-embedding-001"
      : "API key not configured",
  };
}

async function getTableCounts() {
  const [projects, settings, trafficDays, visitorDays, users, sessions, passkeys] =
    await Promise.all([
      prisma.project.count(),
      prisma.siteSetting.count(),
      prisma.siteTrafficDay.count(),
      prisma.siteVisitorDay.count(),
      prisma.user.count(),
      prisma.session.count(),
      prisma.passkey.count(),
    ]);

  return [
    { table: "project", label: "Projects", rows: projects },
    { table: "site_setting", label: "Site settings", rows: settings },
    { table: "site_traffic_day", label: "Traffic days", rows: trafficDays },
    { table: "site_visitor_day", label: "Visitor days", rows: visitorDays },
    { table: "user", label: "Users", rows: users },
    { table: "session", label: "Sessions", rows: sessions },
    { table: "passkey", label: "Passkeys", rows: passkeys },
  ];
}

async function getContentOverview() {
  const [
    total,
    published,
    drafts,
    featured,
    confidential,
    recent,
    missingCover,
    missingIntro,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { published: true } }),
    prisma.project.count({ where: { published: false } }),
    prisma.project.count({ where: { featured: true } }),
    prisma.project.count({ where: { visibility: "CONFIDENTIAL" } }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        published: true,
        featured: true,
        visibility: true,
        year: true,
        updatedAt: true,
        coverImage: true,
      },
    }),
    prisma.project.count({
      where: { OR: [{ coverImage: null }, { coverImage: "" }] },
    }),
    prisma.project.count({
      where: { OR: [{ introSrc: null }, { introSrc: "" }] },
    }),
  ]);

  return {
    total,
    published,
    drafts,
    featured,
    confidential,
    gaps: {
      missingCover,
      missingIntro,
    },
    recent: recent.map((p) => ({
      ...p,
      updatedAt: p.updatedAt.toISOString(),
    })),
  };
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [database, r2, chatAi, tables, content, traffic] = await Promise.all([
    checkDatabase(),
    checkR2(),
    checkChatAi(),
    getTableCounts().catch(() => []),
    getContentOverview().catch(() => null),
    getTrafficSummary().catch(() => null),
  ]);

  const services = [database, r2, chatAi, checkGemini()];
  const online = services.filter((s) => s.status === "online").length;

  return NextResponse.json({
    summary: {
      total: services.length,
      online,
      degraded: services.filter((s) => s.status === "degraded").length,
      offline: services.filter((s) => s.status === "offline").length,
      avgPing: Math.round(
        services.filter((s) => s.ping > 0).reduce((a, s) => a + s.ping, 0) /
          Math.max(1, services.filter((s) => s.ping > 0).length),
      ),
    },
    services,
    tables,
    content,
    traffic,
    ai: getCmsAiProviderInfo(),
    checkedAt: new Date().toISOString(),
  });
}
