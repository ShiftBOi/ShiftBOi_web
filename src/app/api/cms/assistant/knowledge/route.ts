import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

function toSource(row: {
  id: string;
  title: string;
  content: string;
  source: string | null;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.title,
    kind: row.source || "note",
    updatedAt: row.updatedAt.toISOString(),
    chars: row.content.length,
  };
}

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const rows = await prisma.cmsAiKnowledge.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return ok({
    sources: rows.map(toSource),
    chunkCount: rows.length,
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    query?: string;
    name?: string;
    text?: string;
    title?: string;
    content?: string;
    source?: string;
    id?: string;
  } | null;

  const action = body?.action || "note";

  if (action === "sync") {
    return ok({ synced: true });
  }

  if (action === "query") {
    const q = (body?.query || "").trim().toLowerCase();
    const rows = await prisma.cmsAiKnowledge.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
    });
    const results = rows
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q),
      )
      .slice(0, 12)
      .map((r) => ({
        id: r.id,
        title: r.title,
        snippet: r.content.slice(0, 220),
        score: 1,
      }));
    return ok({ results });
  }

  if (action === "note" || body?.text || body?.content) {
    const title = (body?.name || body?.title || "Manual note").trim();
    const content = (body?.text || body?.content || "").trim();
    if (!content) {
      return NextResponse.json(
        { success: false, error: "text required" },
        { status: 400 },
      );
    }
    if (body?.id) {
      const row = await prisma.cmsAiKnowledge.update({
        where: { id: body.id },
        data: { title, content, source: body.source?.trim() || "note" },
      });
      return ok({ source: toSource(row) });
    }
    const row = await prisma.cmsAiKnowledge.create({
      data: {
        title,
        content,
        source: body?.source?.trim() || "note",
      },
    });
    return ok({ source: toSource(row) });
  }

  return NextResponse.json(
    { success: false, error: "Unknown action" },
    { status: 400 },
  );
}

export async function DELETE(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { success: false, error: "id required" },
      { status: 400 },
    );
  }
  await prisma.cmsAiKnowledge.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}
