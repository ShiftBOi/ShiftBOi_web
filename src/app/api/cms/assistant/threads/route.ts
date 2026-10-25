import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";

export const runtime = "nodejs";

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();

  if (!prisma.cmsChatThread) {
    return ok({ threads: [] });
  }

  try {
    const threads = await prisma.cmsChatThread.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    });

    return ok({
      threads: threads.map((t) => ({
        id: t.id,
        title: t.title,
        updatedAt: t.updatedAt,
        preview: t.messages[0]?.content?.slice(0, 120) || "",
      })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to load threads",
        data: { threads: [] },
      },
      { status: 200 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = (await request.json().catch(() => null)) as {
    title?: string;
  } | null;
  const thread = await prisma.cmsChatThread.create({
    data: { title: body?.title?.trim() || "New chat" },
  });
  return ok({ thread });
}

export async function DELETE(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  await prisma.cmsChatMessage.deleteMany();
  await prisma.cmsChatThread.deleteMany();
  return ok({ cleared: true });
}
