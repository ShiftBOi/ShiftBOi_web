import { NextRequest, NextResponse } from "next/server";
import { requireCmsAdmin, unauthorized } from "@/lib/cms-admin-api";
import { getAboutBundle, saveAboutBundle } from "@/lib/cms-about";

export async function GET(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const bundle = await getAboutBundle();
  return NextResponse.json({ success: true, data: bundle.skills });
}

export async function POST(request: NextRequest) {
  if (!(await requireCmsAdmin(request))) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const bundle = await getAboutBundle();
  const row = {
    id: `skill_${Date.now()}`,
    name: String(body.name || ""),
    category: String(body.category || "Other"),
    order: bundle.skills.length,
  };
  bundle.skills.push(row);
  await saveAboutBundle(bundle);
  return NextResponse.json({ success: true, data: row });
}
