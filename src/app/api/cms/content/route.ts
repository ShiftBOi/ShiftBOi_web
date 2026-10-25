import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getAboutBundle, saveAboutBundle } from "@/lib/cms-about";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();

  const [inquiries, bundle] = await Promise.all([
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    getAboutBundle(),
  ]);

  return NextResponse.json({
    inquiries: inquiries.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      message: r.message,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
      read: r.read,
    })),
    profile: bundle.profile,
  });
}

export async function PUT(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = await request.json().catch(() => null);
  if (body?.section === "profile" && body.profile) {
    const bundle = await getAboutBundle();
    bundle.profile = {
      name: String(body.profile.name || ""),
      title: String(body.profile.title || ""),
      wordmark: String(body.profile.wordmark || "ShiftBOi"),
      heroSubhead: String(body.profile.heroSubhead || ""),
      heroHelper: String(body.profile.heroHelper || ""),
      email: String(body.profile.email || ""),
    };
    await saveAboutBundle(bundle);
    return NextResponse.json({ ok: true, profile: bundle.profile });
  }
  return NextResponse.json({ error: "Unsupported section" }, { status: 400 });
}
