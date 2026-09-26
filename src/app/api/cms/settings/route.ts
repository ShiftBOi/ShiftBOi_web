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

const KEYS = ["hero", "stats", "focus", "engagement", "contact", "brand"] as const;

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (key) {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    return NextResponse.json({ key, value: row?.value ?? null });
  }

  const rows = await prisma.siteSetting.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json({
    settings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
  });
}

const patchSchema = z.object({
  key: z.enum(KEYS),
  value: z.unknown(),
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

  const row = await prisma.siteSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: parsed.data.value as object },
    create: { key: parsed.data.key, value: parsed.data.value as object },
  });

  return NextResponse.json({ key: row.key, value: row.value });
}
