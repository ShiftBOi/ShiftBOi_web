import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/constants";

async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || !isAllowedAdminEmail(session.user.email)) {
    return null;
  }
  return session;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [inquiries, unread, sent] = await Promise.all([
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        replies: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.inquiry.count({ where: { read: false } }),
    prisma.inquiryReply.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return NextResponse.json({ inquiries, unread, sent });
}

const patchSchema = z.object({
  id: z.string().min(1),
  read: z.boolean().optional(),
  delete: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.delete) {
    await prisma.inquiry.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (typeof parsed.data.read === "boolean") {
    const row = await prisma.inquiry.update({
      where: { id: parsed.data.id },
      data: { read: parsed.data.read },
    });
    return NextResponse.json({ inquiry: row });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
