import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  const thread = await prisma.cmsChatThread.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 },
    );
  }
  return ok({
    thread: {
      id: thread.id,
      title: thread.title,
      model: null,
      messages: thread.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        reasoning: null,
        tools: null,
        status: "done",
      })),
    },
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const { id } = await params;
  await prisma.cmsChatThread.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}
