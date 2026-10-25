import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SETTINGS_KEY = "__assistant_memory_settings";

type MemorySettings = { savedMemories: boolean; chatHistory: boolean };

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

async function readSettings(): Promise<MemorySettings> {
  const row = await prisma.cmsAiMemory.findUnique({
    where: { key: SETTINGS_KEY },
  });
  if (!row?.value) return { savedMemories: true, chatHistory: true };
  try {
    const parsed = JSON.parse(row.value) as Partial<MemorySettings>;
    return {
      savedMemories: parsed.savedMemories !== false,
      chatHistory: parsed.chatHistory !== false,
    };
  } catch {
    return { savedMemories: true, chatHistory: true };
  }
}

function toMemory(row: { id: string; key: string; value: string; updatedAt: Date }) {
  let group = "general";
  let text = row.value;
  try {
    const parsed = JSON.parse(row.value) as { text?: string; group?: string };
    if (parsed.text) {
      text = parsed.text;
      group = parsed.group || "general";
    }
  } catch {
    /* plain string value */
  }
  return {
    id: row.id,
    text,
    group,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const rows = await prisma.cmsAiMemory.findMany({
    orderBy: { updatedAt: "desc" },
  });
  const memories = rows
    .filter((r) => r.key !== SETTINGS_KEY)
    .map(toMemory);
  const settings = await readSettings();
  return ok({ memories, settings });
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = (await request.json().catch(() => null)) as {
    text?: string;
    group?: string;
    key?: string;
    value?: string;
  } | null;

  const text = (body?.text || body?.value || "").trim();
  if (!text) {
    return NextResponse.json(
      { success: false, error: "text required" },
      { status: 400 },
    );
  }
  const group = (body?.group || "general").trim() || "general";
  const key =
    body?.key?.trim() ||
    `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const memory = await prisma.cmsAiMemory.upsert({
    where: { key },
    create: {
      key,
      value: JSON.stringify({ text, group }),
    },
    update: {
      value: JSON.stringify({ text, group }),
    },
  });
  return ok({ memory: toMemory(memory) });
}

export async function PATCH(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = (await request.json().catch(() => null)) as {
    settings?: Partial<MemorySettings>;
  } | null;
  const current = await readSettings();
  const next = { ...current, ...(body?.settings || {}) };
  await prisma.cmsAiMemory.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return ok({ settings: next });
}

export async function DELETE(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const id = request.nextUrl.searchParams.get("id")?.trim();
  const key = request.nextUrl.searchParams.get("key")?.trim();
  if (id) {
    await prisma.cmsAiMemory.delete({ where: { id } }).catch(() => null);
  } else if (key) {
    await prisma.cmsAiMemory.deleteMany({ where: { key } });
  } else {
    return NextResponse.json(
      { success: false, error: "id or key required" },
      { status: 400 },
    );
  }
  return ok({ deleted: true });
}
