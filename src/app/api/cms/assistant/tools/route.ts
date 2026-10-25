import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { BUILTIN_TOOLS, TOOL_SERVERS } from "@/lib/assistant/tool-catalog";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const DISABLED_KEY = "__assistant_disabled_tools";

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

async function readDisabled(): Promise<Set<string>> {
  const row = await prisma.cmsAiMemory.findUnique({
    where: { key: DISABLED_KEY },
  });
  if (!row?.value) return new Set();
  try {
    const arr = JSON.parse(row.value) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

async function writeDisabled(ids: Set<string>) {
  await prisma.cmsAiMemory.upsert({
    where: { key: DISABLED_KEY },
    create: { key: DISABLED_KEY, value: JSON.stringify([...ids]) },
    update: { value: JSON.stringify([...ids]) },
  });
}

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const disabled = await readDisabled();
  const servers = TOOL_SERVERS.map((s) => ({
    id: s.id,
    name: s.name,
    transport: s.transport,
    tools: BUILTIN_TOOLS.filter((t) => t.server === s.id).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      access: t.access,
      tokens: t.tokens,
      enabled: !disabled.has(t.id),
    })),
  }));
  const toolsTotal = BUILTIN_TOOLS.length;
  const toolsOn = BUILTIN_TOOLS.filter((t) => !disabled.has(t.id)).length;
  const tokens = BUILTIN_TOOLS.filter((t) => !disabled.has(t.id)).reduce(
    (s, t) => s + t.tokens,
    0,
  );
  return ok({
    servers,
    budget: 8000,
    tokens,
    toolsOn,
    toolsTotal,
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = (await request.json().catch(() => null)) as {
    toolId?: string;
    enabled?: boolean;
  } | null;
  const toolId = body?.toolId?.trim();
  if (!toolId || typeof body?.enabled !== "boolean") {
    return NextResponse.json(
      { success: false, error: "toolId and enabled required" },
      { status: 400 },
    );
  }
  const disabled = await readDisabled();
  if (body.enabled) disabled.delete(toolId);
  else disabled.add(toolId);
  await writeDisabled(disabled);
  return ok({ toolId, enabled: body.enabled });
}
